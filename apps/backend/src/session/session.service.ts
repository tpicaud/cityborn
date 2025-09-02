import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Categories, defaultGuess, Game, GameStatus, OnlinePlayer, RoundStatus, Session, SessionMode, SessionStatus } from '@cityborn/types';
import { CreateSessionDto } from './dto/create-session.dto';
import { RedisService } from 'src/redis/redis.service';
import { LockService } from 'src/lock/lock.service';
import { PlayerService } from 'src/player/player.service';
import { IdService } from 'src/id/id.service';
import { ErrorCode } from '@cityborn/errors';
import { GameConfig } from './session.schema';
import { GuessObjectService } from 'src/guess-object/guess-object.service';

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
        private readonly idService: IdService,
        private readonly guessObjectService: GuessObjectService
    ) { }

    private getKey(id: string): string {
        return `${this.prefix}${id}`;
    }


    ////////////////////
    // Session method //
    ////////////////////

    async create(dto: CreateSessionDto): Promise<Session> {
        const { mode } = dto;

        const sessionID: string = await this.generateUniqueSessionID();

        const newSession: Session = {
            id: sessionID,
            hostID: mode === SessionMode.SOLO ? 'guest' : '',
            mode: mode,
            status: SessionStatus.IN_LOBBY,
            gameConfig: {
                categories: [Categories.TOUTES],
                timer: 20,
                nbOfObjects: 6
            },
            players: mode === SessionMode.SOLO ? [{ id: 'guest' }] : [],
        };

        if (mode === SessionMode.MULTI) await this.saveSession(newSession);
        return newSession;
    }

    async getById(sessionID: string): Promise<Session> {
        const session = await this.getSession(sessionID);

        if (!session) {
            throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found.` });
        }

        return session;
    }

    async join(socketID: string, sessionID: string, playerID: string) {
        return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {

            // Récupération de la session
            const session: Session | null = await this.getSession(sessionID);
            if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found` });

            // Check si une partie est déjà en cours
            if (session.currentGame) throw new ForbiddenException({ code: ErrorCode.SESSION_ALREADY_IN_GAME, message: `Session already in game` });

            // Check si l'id du joueur est déjà dans la session
            const playerExists = session.players.some((player: any) => player.id === playerID);
            if (playerExists) throw new ConflictException({ code: ErrorCode.SESSION_PLAYER_ALREADY_EXISTS, message: `Player already exists in session` });

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
        if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with this socket` });

        const { playerID, sessionID } = player;

        // Récupération du jeu dans la base de données
        const session: Session | null = await this.getSession(sessionID)
        if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found` });

        // Check si la session n'est pas déjà en game
        if (session.status === "IN_GAME") throw new BadRequestException({ code: ErrorCode.SESSION_ALREADY_IN_GAME, message: `Session is already in game` });

        // Check si le joueur est le host
        if (session.hostID !== playerID) throw new ForbiddenException({ code: ErrorCode.SESSION_FORBIDDEN_HOST, message: `Player is not the host` });

        // Check si le nouveau host est dans la session
        const newHost = session.players.find((player: any) => player.id === newHostID && player.connected);
        if (!newHost) throw new NotFoundException({ code: ErrorCode.SESSION_PLAYER_NOT_FOUND, message: `Player not found in session` });

        // Update gameConfig
        session.hostID = newHost.id;

        await this.saveSession(session);
        return session;
    }

    async updateGameConfig(socketID: string, gameConfig: any) {

        // Récupération du joueur
        const player = await this.playerService.getPlayer(socketID);
        if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with this socket` });

        const { playerID, sessionID } = player;

        // Récupération du jeu dans la base de données
        const session: any | undefined = await this.getSession(sessionID)
        if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found` });

        // Check si une partie est déjà en cours
        if (session.currentGame) throw new ForbiddenException({ code: ErrorCode.SESSION_ALREADY_IN_GAME, message: `Session already in game` });

        // Check si le joueur est le host
        if (session.hostID !== playerID) throw new ForbiddenException({ code: ErrorCode.SESSION_FORBIDDEN_HOST, message: `Player is not the host` });

        // Update gameConfig
        session.gameConfig = gameConfig;

        await this.saveSession(session);
        return session;
    }

    async startGame(socketID: string) {

        // Récupération du joueur
        const player = await this.playerService.getPlayer(socketID);
        if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with this socket` });

        const { playerID, sessionID } = player;

        // Récupération du jeu dans la base de données
        const session: Session | null = await this.getSession(sessionID)
        if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found` });

        // Check si une partie est déjà en cours
        if (session.currentGame) throw new ForbiddenException({ code: ErrorCode.SESSION_ALREADY_IN_GAME, message: `Session already in game` });

        // Check si le joueur est le host
        if (session.hostID !== playerID) throw new ForbiddenException({ code: ErrorCode.SESSION_FORBIDDEN_HOST, message: `Player is not the host` });

        // Créer une nouvelle partie
        const game = await this.createGame(session.gameConfig);

        // Update session
        session.status = SessionStatus.IN_GAME;
        session.currentGame = game;

        await this.saveSession(this.getLightSession(session));
        return session;
    }

    async endGame(socketID: string) {

        // Récupération du joueur
        const player = await this.playerService.getPlayer(socketID);
        if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with this socket` });

        const { playerID, sessionID } = player;


        // Récupération du jeu dans la base de données
        const session: Session | null = await this.getSession(sessionID)
        if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found` });

        // Check si le joueur est le host
        if (session.hostID !== playerID) throw new ForbiddenException({ code: ErrorCode.SESSION_FORBIDDEN_HOST, message: `Player is not the host of the session` });

        // Check si une partie est en cours
        if (!session.currentGame) throw new NotFoundException({ code: ErrorCode.SESSION_NO_CURRENT_GAME, message: `No current game in session this` });

        // Update session
        session.status = SessionStatus.IN_LOBBY;
        session.currentGame = undefined

        await this.saveSession(session);
        return session;
    }

    /////////////////////////
    // Current game method //
    /////////////////////////

    async createGame(gameConfig: GameConfig): Promise<Game> {
        const guessObjects = await this.guessObjectService.findByGameConfig(gameConfig);
        const guessObjectIds = guessObjects.map(obj => obj.id);
        const game: Game = {
            id: await this.generateUniqueGameID(),
            status: GameStatus.STARTING,
            state: {
                guessObjectsIds: guessObjectIds,
                results: {},
                guessObjects: guessObjects
            }
        }

        return game;
    }

    async handleGuess(socketID: string, guess: any) {
        // Récupération du joueur
        const player = await this.playerService.getPlayer(socketID);
        if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with socket` });

        const { playerID, sessionID } = player;

        return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {
            // Récupération du jeu dans la base de données
            const session = await this.getSession(sessionID);
            if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found` });

            // Check si la partie existe
            if (!session.currentGame) throw new NotFoundException({ code: ErrorCode.SESSION_NO_CURRENT_GAME, message: `No current game in this session` });
            const game = session.currentGame;

            // Vérifier si playerID existe dans la liste des joueurs (game.players)
            const playerExists = session.players.some((player: any) => player.id === playerID);
            if (!playerExists) throw new NotFoundException({ code: ErrorCode.SESSION_PLAYER_NOT_FOUND, message: `Player not found in session` })

            // Vérifier si playerID est connecté
            const playerConnected = session.players.some((player: any) => player.id === playerID && player.connected);
            if (!playerConnected) throw new UnauthorizedException({ code: ErrorCode.SESSION_PLAYER_NOT_CONNECTED, message: `Player is not connected` });

            // Vérifier si un round est actif
            if (!game.state.currentRound) throw new UnauthorizedException({ code: ErrorCode.GAME_NO_ACTIVE_ROUND, message: `No active round on current game` })

            if (game.state.currentRound.playersGuesses && !game.state.currentRound.playersGuesses[playerID]) {
                // Mettre à jour le guess du joueur dans currentRound.playersGuesses
                game.state.currentRound.playersGuesses[playerID] = guess;

                // Vérifier si tout le monde à guess
                const connectedPlayers = session.players.filter((player: any) => player.connected);
                const allConnectedPlayersGuessed = connectedPlayers.every((player: any) =>
                    game.state.currentRound!.playersGuesses!.hasOwnProperty(player.id)
                );
                if (allConnectedPlayersGuessed) {
                    // Add null guesses
                    for (const player of session.players) {
                        if (!game.state.currentRound.playersGuesses[player.id]) {
                            game.state.currentRound.playersGuesses[player.id] = defaultGuess;
                        }
                    }

                    // Update round status
                    game.state.currentRound.status = RoundStatus.SHOWING_RESULTS;
                }

                session.currentGame = game;
                await this.saveSession(session);
            }
            return game;
        });
    }

    async handleNextRound(socketID: string) {
        // Récupération du joueur
        const player = await this.playerService.getPlayer(socketID);
        if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with this socket` });

        const { playerID, sessionID } = player;

        // Récupération du jeu dans la base de données
        const session = await this.getSession(sessionID);
        if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found` });

        // Check si la partie existe
        if (!session.currentGame) throw new NotFoundException({ code: ErrorCode.SESSION_NO_CURRENT_GAME, message: `No current game in this session` });
        const game = session.currentGame;

        // Vérifier que le host
        if (session.hostID !== playerID) {
            throw new UnauthorizedException({ code: ErrorCode.SESSION_FORBIDDEN_HOST, message: `Player is not the host` });
        }

        // Trouver l'index du currentRound
        const currentIndex = game.state.guessObjectsIds.findIndex((id: string) => id === game.state.currentRound!.guessObjectId);

        // Register result
        session.players.forEach((player: any) => {
            const guess = game.state.currentRound!.playersGuesses![player.id];
            const playerResults = game.state.results[player.id];

            const newResult = {
                guessObjectId: game.state.currentRound?.guessObjectId ?? '',
                distance: guess ? guess.distance : -1,
                points: guess ? guess.points : 0
            };

            if (playerResults && playerResults.results) {
                playerResults.results.push(newResult);
            } else {
                game.state.results[player.id] = { results: [newResult] };
            }
        });


        // Go to next guess object
        if (currentIndex + 1 >= game.state.guessObjectsIds.length) {
            game.status = GameStatus.IN_RESULTS;
            //game.state.currentRound = undefined
        } else {
            game.state.currentRound = {
                status: RoundStatus.GUESSING,
                guessObjectId: game.state.guessObjectsIds[currentIndex + 1],
                playersGuesses: {},
            }
        }

        // Update game and send to the room
        session.currentGame = game;
        await this.saveSession(session);

        return game;
    }

    ///////////////////////
    // Connection method //
    ///////////////////////

    async reconnectPlayer(socketID: string, sessionID: string, playerID: string) {
        return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {

            // Récupération du jeu dans la base de données
            const session: Session | null = await this.getSession(sessionID);
            if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found` });

            // Get players
            const players = session.players as OnlinePlayer[];

            // Check si l'id du joueur est dans la session
            const playerIndex = players.findIndex((player: any) => player.id === playerID);
            if (playerIndex === -1) throw new NotFoundException({ code: ErrorCode.SESSION_PLAYER_NOT_FOUND, message: `Player not found in session` });

            // Register new player socket
            await this.playerService.save(socketID, playerID, sessionID);

            // Reconnexion du joueur
            players[playerIndex].connected = true;

            // Check host
            if (session.hostID === '') session.hostID = playerID;

            await this.saveSession(session);
            return session;
        });
    }

    async disconnectPlayer(socketID: string) {

        // Récupération du joueur
        const player = await this.playerService.getPlayer(socketID);
        if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with socket` });

        const { playerID, sessionID } = player;

        return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {

            // Récupération du jeu dans la base de données
            const session: Session | null = await this.getSession(sessionID)
            if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found` });

            // Check si l'id du joueur est dans la partie
            const playerIndex = session.players.findIndex((player: any) => player.id === playerID);
            if (playerIndex === -1) throw new NotFoundException({ code: ErrorCode.SESSION_PLAYER_NOT_FOUND, message: `Player not found in session` });

            // Déconnexion du joueur
            (session.players[playerIndex] as OnlinePlayer).connected = false;

            // Update host
            const isHost = playerID === session.hostID;
            if (isHost) {
                const players = session.players;

                const connectedPlayers = players.filter((player: any) => player.connected && player.id !== playerID);
                if (connectedPlayers.length > 0) {
                    session.hostID = connectedPlayers[0].id;
                } else {
                    session.hostID = '';
                }
            }

            // Notifier la game
            // if (session.currentGame && session.currentGame.status === 'FINISHED') {
            //     session.status = SessionStatus.IN_LOBBY;
            //     session.currentGame = undefined;
            // }

            // Update states
            await this.playerService.deletePlayer(socketID);
            await this.saveSession(session);

            return session;
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

    // Private function
    private async generateUniqueSessionID(): Promise<string> {
        const MAX_ATTEMPTS = 3;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const candidateId = this.idService.generateNanoId();
            if (!(await this.getSession(candidateId))) return candidateId.toString();
        }

        throw new InternalServerErrorException({ code: ErrorCode.SESSION_CREATION_FAILED, message: 'Max id generation attempt reached' });
    }


    async generateUniqueGameID(): Promise<string> {
        const MAX_ATTEMPTS = 3;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const candidateId = this.idService.generateUniqueNamesId();
            //if (!(await this.getGame(candidateId))) return candidateId.toString();
            return candidateId.toString(); // TODO Check in supabase and redis for conflicts
        }

        throw new InternalServerErrorException({ code: ErrorCode.GAME_CREATION_FAILED, message: 'Max id generation attempt reached' });
    }

    private getLightSession(session: Session): Session {
        let lightSession = session;

        if (session.currentGame) {
            const { guessObjects, ...restState } = session.currentGame.state;

            const lightSession: Session = {
                ...session,
                currentGame: {
                    ...session.currentGame,
                    state: {
                        ...restState,
                    }
                },
            }
        }

        return lightSession;
    }
}
