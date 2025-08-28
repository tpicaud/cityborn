import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Categories, Game, GameMode, OnlinePlayer, Session, SessionStatus } from '@cityborn/types';
import { CreateSessionDto } from './dto/create-session.dto';
import { RedisService } from 'src/redis/redis.service';
import { LockService } from 'src/lock/lock.service';
import { PlayerService } from 'src/player/player.service';
import { GameService } from 'src/game/game.service';
import { IdService } from 'src/id/id.service';
import { ErrorCode } from '@cityborn/errors';

@Injectable()
export class SessionService {
    private readonly prefix = 'session:';
    private readonly TTL = 30 * 60; // seconds
    private readonly LOCK_TTL = 2000;
    private readonly logger = new Logger(SessionService.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly lockService: LockService,
        private readonly playerService: PlayerService,
        private readonly gameService: GameService,
        private readonly idService: IdService
    ) { }

    private getKey(id: string): string {
        return `${this.prefix}${id}`;
    }


    /////////////
    // Methods //
    /////////////

    async create(dto: CreateSessionDto): Promise<Session> {
        const { gameMode } = dto;

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
    }

    async getById(sessionID: string): Promise<Session> {
        const session = await this.getSession(sessionID);

        if (!session) {
            throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session with ID "${sessionID}" not found.` });
        }

        return session;
    }

    async join(socketID: string, sessionID: string, playerID: string) {
        return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {

            // Récupération de la session
            const session: Session | null = await this.getSession(sessionID);
            if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session ${sessionID} not found` });

            // Check si l'id du joueur est déjà dans la session
            const playerExists = session.players.some((player: any) => player.id === playerID);
            if (playerExists) throw new ConflictException({ code: ErrorCode.SESSION_PLAYER_ALREADY_EXISTS, message: `Player ${playerID} already exists in session` });

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
    }

    async updateHost(socketID: string, newHostID: string) {

        // Récupération du joueur
        const player = await this.playerService.getPlayer(socketID);
        if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with socket ${socketID}` });

        const { playerID, sessionID } = player;

        // Récupération du jeu dans la base de données
        const session: Session | null = await this.getSession(sessionID)
        if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session ${sessionID} not found` });

        // Check si la session n'est pas déjà en game
        if (session.status === "IN_GAME") throw new BadRequestException({ code: ErrorCode.SESSION_ALREADY_IN_GAME, message: `Session ${sessionID} is already in game` });

        // Check si le joueur est le host
        if (session.hostID !== playerID) throw new ForbiddenException({ code: ErrorCode.SESSION_FORBIDDEN_HOST, message: `Player ${playerID} is not ${sessionID}'s host` });

        // Check si le nouveau host est dans la session
        const newHost = session.players.find((player: any) => player.id === newHostID && player.connected);
        if (!newHost) throw new NotFoundException({ code: ErrorCode.SESSION_PLAYER_NOT_FOUND, message: `Player ${playerID} not found in session ${sessionID}` });

        // Update gameConfig
        session.hostID = newHost.id;

        await this.saveSession(session);
        return session;
    }

    async updateGameConfig(socketID: string, gameConfig: any) {

        // Récupération du joueur
        const player = await this.playerService.getPlayer(socketID);
        if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with socket ${socketID}` });

        const { playerID, sessionID } = player;

        // Récupération du jeu dans la base de données
        const session: any | undefined = await this.getSession(sessionID)
        if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session ${sessionID} not found` });

        // Check si le joueur est le host
        if (session.hostID !== playerID) throw new ForbiddenException({ code: ErrorCode.SESSION_FORBIDDEN_HOST, message: `Player ${playerID} is not ${sessionID}'s host` });

        // Update gameConfig
        session.gameConfig = gameConfig;

        await this.saveSession(session);
        return session;
    }

    async startGame(socketID: string) {

        // Récupération du joueur
        const player = await this.playerService.getPlayer(socketID);
        if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with socket ${socketID}` });

        const { playerID, sessionID } = player;


        // Récupération du jeu dans la base de données
        const session: Session | null = await this.getSession(sessionID)
        if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session ${sessionID} not found` });

        // Check si le joueur est le host
        if (session.hostID !== playerID) throw new ForbiddenException({ code: ErrorCode.SESSION_FORBIDDEN_HOST, message: `Player ${playerID} is not ${sessionID}'s host` });

        // Créer une nouvelle partie
        const game = await this.gameService.create({
            gameMode: session.mode,
            hostID: session.hostID,
            playersID: (session.players as OnlinePlayer[]).filter(player => player.connected).map(player => player.id),
            gameConfig: session.gameConfig
        });

        // Update session
        session.status = SessionStatus.IN_GAME;
        session.currentGameId = game.id;

        await this.saveSession(session, 12 * 60 * 60); // TTL in seconds
        return { session, gameID: game.id };
    }

    async endGame(socketID: string) {

        // Récupération du joueur
        const player = await this.playerService.getPlayer(socketID);
        if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with socket ${socketID}` });

        const { playerID, sessionID } = player;


        // Récupération du jeu dans la base de données
        const session: Session | null = await this.getSession(sessionID)
        if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session ${sessionID} not found` });

        // Check si le joueur est le host
        if (session.hostID !== playerID) throw new ForbiddenException({ code: ErrorCode.SESSION_FORBIDDEN_HOST, message: `Player ${playerID} is not ${sessionID}'s host` });

        // Check si une partie est en cours
        if (!session.currentGameId) throw new NotFoundException({ code: ErrorCode.SESSION_NO_CURRENT_GAME, message: `No current game in session ${sessionID}` });

        // Check si la partie est terminée
        const game = await this.gameService.get(session.currentGameId);
        if (!game) throw new NotFoundException({ code: ErrorCode.GAME_NOT_FOUND, message: `Game ${session.currentGameId} not found` });

        // Update session
        session.status = SessionStatus.IN_LOBBY;
        session.currentGameId = undefined

        await this.saveSession(session);
        return session;
    }

    async reconnectPlayer(socketID: string, sessionID: string, playerID: string) {
        return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {

            // Récupération du jeu dans la base de données
            const session: Session | null = await this.getSession(sessionID);
            if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session ${sessionID} not found` });

            // Get players
            const players = session.players as OnlinePlayer[];

            // Check si l'id du joueur est dans la session
            const playerIndex = players.findIndex((player: any) => player.id === playerID);
            if (playerIndex === -1) throw new NotFoundException({ code: ErrorCode.SESSION_PLAYER_NOT_FOUND, message: `Player ${playerID} not found in session ${sessionID}` });

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
    }

    async disconnectPlayer(socketID: string) {

        // Récupération du joueur
        const player = await this.playerService.getPlayer(socketID);
        if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with socket ${socketID}` });

        const { playerID, sessionID } = player;

        return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {

            // Récupération du jeu dans la base de données
            const session: Session | null = await this.getSession(sessionID)
            if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session ${sessionID} not found` });

            // Check si l'id du joueur est dans la partie
            const playerIndex = session.players.findIndex((player: any) => player.id === playerID);
            if (playerIndex === -1) throw new NotFoundException({ code: ErrorCode.SESSION_PLAYER_NOT_FOUND, message: `Player ${playerID} not found in session ${sessionID}` });

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
    }

    ///////////
    // Store //
    ///////////

    private async getSession(sessionID: string): Promise<Session | null> {
        return await this.redisService.getJSON<Session>(this.getKey(sessionID));
    }

    private async saveSession(session: Session, ttl: number = this.TTL): Promise<void> {
        await this.redisService.setJSON(this.getKey(session.id), session, ttl);
    }

    private async deleteSession(sessionID: string): Promise<void> {
        await this.redisService.del(this.getKey(sessionID));
    }

    // Auxiliary
    private async generateUniqueSessionID(): Promise<string> {
        const MAX_ATTEMPTS = 3;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const candidateId = this.idService.generateNanoId();
            if (!(await this.getSession(candidateId))) return candidateId.toString();
        }

        throw new InternalServerErrorException({ code: ErrorCode.SESSION_CREATION_FAILED, message: 'Max id generation attempt reached' });
    }

    // Private function
    private async isInGame(gameID: string, playerID: string) {
        const game = await this.gameService.get(gameID);
        return game.players.some(player => player.id === playerID);
    }
}
