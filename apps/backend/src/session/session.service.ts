import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Categories, Game, GameMode, OnlinePlayer, Session, SessionStatus } from '@cityborn/types';
import { CreateSessionDto } from './dto/create-session.dto';
import { customAlphabet } from 'nanoid';
import { RedisService } from 'src/redis/redis.service';
import { LockService } from 'src/lock/lock.service';
import { PlayerService } from 'src/player/player.service';
import { GameService } from 'src/game/game.service';

const generateID = customAlphabet('0123456789', 6);

@Injectable()
export class SessionService {
    private readonly prefix = 'session:';
    private readonly TTL = 30 * 60 * 1000;
    private readonly LOCK_TTL = 2000;
    private readonly logger = new Logger(SessionService.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly lockService: LockService,
        private readonly playerService: PlayerService,
        private readonly gameService: GameService
    ) { }

    private getKey(id: string): string {
        return `${this.prefix}${id}`;
    }


    /////////////
    // Methods //
    /////////////

    async create(dto: CreateSessionDto): Promise<Session> {
        const { gameMode } = dto

        try {
            const sessionID: string = await this.generateUniqueSessionID();

            const newSession: Session = {
                id: sessionID,
                hostID: gameMode === GameMode.SOLO ? 'guest' : '',
                mode: gameMode,
                status: SessionStatus.IN_LOBBY,
                gameConfig: {
                    categories: [Categories.TOUTES],
                    timer: 20,
                    nbOfObjects: 6
                },
                players: gameMode === GameMode.SOLO ? [{ id: 'guest' }] : [],
            };

            if (gameMode === GameMode.MULTI) await this.saveSession(newSession);
            return newSession;
        } catch (error) {
            this.logger.error('Error creating session:', error.stack);
            throw new InternalServerErrorException('Unable to create session');
        }
    }

    async getById(sessionID: string): Promise<Session> {
        try {
            const session = await this.getSession(sessionID);

            if (!session) {
                throw new NotFoundException(`Session with ID "${sessionID}" not found.`);
            }

            return session;
        } catch (error) {
            throw new InternalServerErrorException('Failed to retrieve session from Redis.');
        }
    }

    async join(socketID: string, sessionID: string, playerID: string) {
        try {
            return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {

                // Récupération de la session
                const session: any | undefined = await this.getSession(sessionID);
                if (!session) throw new Error("Session introuvable.");

                // Check si l'id du joueur est déjà dans la session
                const playerExists = session.players.some((player: any) => player.id === playerID);
                if (playerExists) throw new Error("Le joueur est déjà dans la session.");

                // Register player socket
                await this.playerService.save(socketID, playerID, sessionID);

                // Créer un nouveau joueur
                const newPlayer: any = { id: playerID, sessionID: sessionID, connected: true };
                if (session.players.length === 0) session.hostID = playerID;
                session.players.push(newPlayer);

                // Set host si necéssaire
                if (session.hostID === '') session.hostID = playerID;

                // Save session
                await this.saveSession(session);
                return session;
            });
        } catch (error) {
            throw new Error(`Erreur lors de la connexion de ${playerID} à la session ${sessionID}: ${error}`);
        }
    }

    async updateHost(socketID: string, newHostID: string) {
        try {
            // Récupération du joueur
            const player = await this.playerService.getPlayer(socketID);
            if (!player) throw new Error(`No player associated with socket ${socketID}`);
            const { playerID, sessionID } = player;

            // Récupération du jeu dans la base de données
            const session: any | undefined = await this.getSession(sessionID)
            if (!session) throw new Error("Session introuvable.");

            // Check si la session n'est pas déjà en game
            if (session.status === "IN_GAME") throw new Error("La session est déjà en jeu");

            // Check si le joueur est le host
            if (session.hostID !== playerID) throw new Error(`Le joueur n'est pas le host de la session`);

            // Check si le nouveau host est dans la session
            const newHost = session.players.find((player: any) => player.id === newHostID && player.connected);
            if (!newHost) throw new Error(`Le joueur ${newHostID} n'est pas dans la session`);

            // Update gameConfig
            session.hostID = newHost.id;

            await this.saveSession(session);
            return session;
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour du host de la session: ${error}`);
        }
    }

    async updateGameConfig(socketID: string, gameConfig: any) {
        try {
            // Récupération du joueur
            const player = await this.playerService.getPlayer(socketID);
            if (!player) throw new Error(`No player associated with socket ${socketID}`);
            const { playerID, sessionID } = player;

            // Récupération du jeu dans la base de données
            const session: any | undefined = await this.getSession(sessionID)
            if (!session) throw new Error("Session introuvable.");

            // Check si le joueur est le host
            if (session.hostID !== playerID) throw new Error(`Le joueur n'est pas le host de la session`);

            // Update gameConfig
            session.gameConfig = gameConfig;

            await this.saveSession(session);
            return session;
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour de la configuration de la partie: ${error}`);
        }
    }

    async startGame(socketID: string) {
        try {
            // Récupération du joueur
            const player = await this.playerService.getPlayer(socketID);
            if (!player) throw new Error(`No player associated with socket ${socketID}`);
            const { playerID, sessionID } = player;


            // Récupération du jeu dans la base de données
            const session: Session | null = await this.getSession(sessionID)
            if (!session) throw new Error("Session introuvable.");

            // Check si le joueur est le host
            if (session.hostID !== playerID) throw new Error(`Le joueur n'est pas le host de la session`);

            // Créer une nouvelle partie
            const game = await this.gameService.create({
                gameMode: session.mode,
                hostID: session.hostID,
                playersID: session.players.map(player => player.id),
                gameConfig: session.gameConfig
            });

            // Update session
            session.status = SessionStatus.IN_GAME;
            session.currentGameId = game.id;

            await this.saveSession(session, 12 * 60 * 60 * 1000);
            return { session, gameID: game.id };
        } catch (error) {
            throw new Error(`Erreur lors du démarrage de la partie: ${error.message}`);
        }
    }

    async endGame(socketID: string) {
        try {
            // Récupération du joueur
            const player = await this.playerService.getPlayer(socketID);
            if (!player) throw new Error(`No player associated with socket ${socketID}`);
            const { playerID, sessionID } = player;


            // Récupération du jeu dans la base de données
            const session: any | undefined = await this.getSession(sessionID)
            if (!session) throw new Error("Session introuvable.");

            // Check si le joueur est le host
            if (session.hostID !== playerID) throw new Error(`Le joueur n'est pas le host de la session`);

            //Check si la partie est terminée
            const game = await this.gameService.get(session.currentGameId);
            if (!game) throw new Error("Aucune partie en cours.");

            // Update session
            session.status = 'IN_LOBBY';
            session.currentGameId = undefined

            await this.saveSession(session);
            return session;
        } catch (error) {
            throw new Error(`Erreur lors de la fin de partie: ${error.message}`);
        }
    }

    async reconnectPlayer(socketID: string, sessionID: string, playerID: string) {
        try {
            return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {

                // Récupération du jeu dans la base de données
                const session: Session | null = await this.getSession(sessionID);
                if (!session) throw new Error("Session introuvable.");

                // Get players
                const players = session.players as OnlinePlayer[];

                // Check si l'id du joueur est dans la session
                const playerIndex = players.findIndex((player: any) => player.id === playerID);
                if (playerIndex === -1) throw new Error(`Le joueur ${playerID} n'est pas dans la session`);

                // Register new player socket
                await this.playerService.save(socketID, playerID, sessionID);

                // Reconnexion du joueur
                players[playerIndex].connected = true;

                // Check host
                if (session.hostID === '') session.hostID = playerID;

                // Check s'il est en game
                const isInGame = session.currentGameId ? await this.isInGame(session.currentGameId, playerID) : false;

                await this.saveSession(session);
                return { session, isInGame };
            });
        } catch (error) {
            throw new Error(`Erreur lors de la reconnexion de ${playerID}: ${error}`);
        }
    }

    async disconnectPlayer(socketID: string) {
        try {
            // Récupération du joueur
            const player = await this.playerService.getPlayer(socketID);
            if (!player) throw new Error(`No player associated with socket ${socketID}`);
            const { playerID, sessionID } = player;

            return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {

                // Récupération du jeu dans la base de données
                const session: Session | null = await this.getSession(sessionID)
                if (!session) throw new Error("Session introuvable.");

                // Check si l'id du joueur est dans la partie
                const playerIndex = session.players.findIndex((player: any) => player.id === playerID);
                if (playerIndex === -1) throw new Error(`Le joueur ${playerID} n'est pas dans la session`);

                // Déconnexion du joueur
                (session.players[playerIndex] as OnlinePlayer).connected = false;

                // Update host
                const isHost = playerID === session.hostID
                if (isHost) {
                    const currentGame = session.currentGameId ? await this.gameService.get(session.currentGameId) : null;
                    const players = currentGame ? currentGame.players : session.players;

                    const connectedPlayers = players.filter((player: any) => player.connected && player.id !== playerID);
                    if (connectedPlayers.length > 0) {
                        session.hostID = connectedPlayers[0].id;
                    } else {
                        session.hostID = '';
                    }
                }

                // Notifier la game
                let game: Game | undefined = undefined;
                if (session.currentGameId && await this.isInGame(session.currentGameId, playerID)) {
                    game = session.currentGameId ? await this.gameService.disconnectPlayer(socketID, isHost ? session.hostID : '') : undefined;
                    if (game && game.status === 'FINISHED') {
                        session.status = SessionStatus.IN_LOBBY;
                        session.currentGameId = undefined;
                    }
                }

                // Update states
                await this.playerService.deletePlayer(socketID);
                await this.saveSession(session);

                return { session, game };
            });
        } catch (error) {
            throw new Error(error.message);
        }
    }

    ///////////
    // Store //
    ///////////

    private async getSession(sessionID: string): Promise<Session | null> {
        try {
            return await this.redisService.getJSON<Session>(this.getKey(sessionID));
        } catch (error) {
            throw new Error(`Error getting session: ${error.message}`);
        }
    }

    private async saveSession(session: Session, ttl: number = this.TTL): Promise<void> {
        try {
            await this.redisService.setJSON(this.getKey(session.id), session, ttl);
        } catch (error) {
            throw new Error(`Error setting session ${session.id}: ${error.message}`);
        }
    }

    private async deleteSession(sessionID: string): Promise<void> {
        try {
            await this.redisService.del(this.getKey(sessionID));
        } catch (error) {
            throw new Error(`Error deleting session: ${sessionID}: ${error.message}`);
        }
    }

    // Auxiliary
    private async generateUniqueSessionID(maxAttempts = 5): Promise<string> {
        try {
            let attempts = 0;

            while (attempts < maxAttempts) {
                const sessionID = generateID();
                const exists = await this.getSession(sessionID);

                if (!exists) return sessionID;

                attempts++;
            }

            throw new InternalServerErrorException('Max attempt reached');
        } catch (error) {
            throw new Error(`Error generating unique ID: ${error.message}`);
        }
    }

    // Private function
    private async isInGame(gameID: string, playerID: string) {
        const game = await this.gameService.get(gameID);
        return game.players.some(player => player.id === playerID);
    }
}
