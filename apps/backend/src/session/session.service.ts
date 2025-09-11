import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Categories, defaultGuess, Game, GameConfig, GameRecord, GameStatus, OnlinePlayer, Round, RoundStatus, Session, SessionMode, SessionStatus } from '@cityborn/types';
import { CreateSessionDto } from './dto/create-session.dto';
import { RedisService } from 'src/redis/redis.service';
import { LockService } from 'src/lock/lock.service';
import { PlayerService } from 'src/player/player.service';
import { IdService } from 'src/id/id.service';
import { ErrorCode } from '@cityborn/errors';
import { GuessObjectService } from 'src/guess-object/guess-object.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
        private readonly guessObjectService: GuessObjectService,
        private readonly prisma: PrismaService
    ) { }

    private getKey(id: string): string {
        return `${this.prefix}${id}`;
    }


    ////////////////////
    // Session method //
    ////////////////////

    async create(dto: CreateSessionDto, user: any): Promise<Session> {
        const { mode } = dto;

        const sessionID: string = await this.generateUniqueSessionID();

        const newSession: Session = {
            id: sessionID,
            hostID: mode === SessionMode.SOLO ? user ? user.username : 'guest' : '',
            mode: mode,
            status: SessionStatus.IN_LOBBY,
            gameConfig: {
                categories: [Categories.TOUTES],
                timer: 20,
                nbOfObjects: 6
            },
            players: mode === SessionMode.SOLO ? [{ username: user ? user.username : 'guest', isGuest: user ? false : true }] : [],
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

    async join(socketID: string, sessionID: string, playerID: string, user: any) {
        return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {

            // Récupération de la session
            const session: Session | null = await this.getSession(sessionID);
            if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found` });

            // Check si une partie est déjà en cours
            if (session.currentGame) throw new ForbiddenException({ code: ErrorCode.SESSION_ALREADY_IN_GAME, message: `Session already in game` });

            // Check si l'id du joueur est déjà dans la session
            const playerExists = session.players.some((player: any) => player.username === playerID);
            if (playerExists) throw new ConflictException({ code: ErrorCode.SESSION_PLAYER_ALREADY_EXISTS, message: `Player already exists in session` });

            // Register player socket
            const isGuest = user ? false : true;
            await this.playerService.save(socketID, playerID, sessionID, isGuest);

            // Créer un nouveau joueur
            const newPlayer: OnlinePlayer = {
                username: playerID,
                isGuest,
                id: isGuest ? undefined : user.sub,
                connected: true,
            };
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
        const newHost = session.players.find((player: any) => player.username === newHostID && player.connected);
        if (!newHost) throw new NotFoundException({ code: ErrorCode.SESSION_PLAYER_NOT_FOUND, message: `Player not found in session` });

        // Update gameConfig
        session.hostID = newHost.username;

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

        // Start first round
        const firstRound: Round = {
            status: RoundStatus.GUESSING,
            guessObjectId: game.state.guessObjectsIds[0],
            playersGuesses: {},
        };
        game.status = GameStatus.IN_GAME;
        game.state.currentRound = firstRound;

        // Update session
        session.status = SessionStatus.IN_GAME;
        session.currentGame = game;

        await this.saveSession(this.getLightSession(session));
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
        if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with this socket` });

        const { playerID, sessionID } = player;

        return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {
            // Récupération du jeu dans la base de données
            const session = await this.getSession(sessionID);
            if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found` });

            // Check si la partie existe
            if (!session.currentGame) throw new NotFoundException({ code: ErrorCode.SESSION_NO_CURRENT_GAME, message: `No current game in this session` });
            const game = session.currentGame;

            // Vérifier si playerID existe dans la liste des joueurs (game.players)
            const playerExists = session.players.some((player: any) => player.username === playerID);
            if (!playerExists) throw new NotFoundException({ code: ErrorCode.SESSION_PLAYER_NOT_FOUND, message: `Player not found in session` })

            // Vérifier si playerID est connecté
            const playerConnected = session.players.some((player: any) => player.username === playerID && player.connected);
            if (!playerConnected) throw new UnauthorizedException({ code: ErrorCode.SESSION_PLAYER_NOT_CONNECTED, message: `Player is not connected` });

            // Vérifier si un round est actif
            if (!game.state.currentRound) throw new UnauthorizedException({ code: ErrorCode.GAME_NO_ACTIVE_ROUND, message: `No active round on current game` })

            if (game.state.currentRound.playersGuesses && !game.state.currentRound.playersGuesses[playerID]) {
                // Mettre à jour le guess du joueur dans currentRound.playersGuesses
                game.state.currentRound.playersGuesses[playerID] = guess;

                // Vérifier si tout le monde à guess
                const connectedPlayers = session.players.filter((player: any) => player.connected);
                const allConnectedPlayersGuessed = connectedPlayers.every((player: any) =>
                    game.state.currentRound!.playersGuesses!.hasOwnProperty(player.username)
                );
                if (allConnectedPlayersGuessed) {
                    // Add null guesses
                    for (const player of session.players) {
                        if (!game.state.currentRound.playersGuesses[player.username]) {
                            game.state.currentRound.playersGuesses[player.username] = defaultGuess;
                        }
                    }

                    // Update round status
                    game.state.currentRound.status = RoundStatus.SHOWING_RESULTS;
                }

                session.currentGame = game;
                await this.saveSession(session);
            }
            return session;
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
            const guess = game.state.currentRound!.playersGuesses![player.username];
            const playerResults = game.state.results[player.username];

            const newResult = {
                guessObjectId: game.state.currentRound?.guessObjectId ?? '',
                distance: guess ? guess.distance : -1,
                points: guess ? guess.points : 0
            };

            if (playerResults && playerResults.results) {
                playerResults.results.push(newResult);
            } else {
                game.state.results[player.username] = { results: [newResult] };
            }
        });


        // Check if game ended
        if (currentIndex + 1 >= game.state.guessObjectsIds.length) {
            // Store game in DB and save ended session
            await this.endGame(session, game);

            const lobbySession: Session = { ...session, status: SessionStatus.IN_LOBBY, currentGame: undefined };
            await this.saveSession(lobbySession);

            // Send results to client
            game.status = GameStatus.IN_RESULTS;
            session.currentGame = game;
        } else {
            // Go to next guess object
            game.state.currentRound = {
                status: RoundStatus.GUESSING,
                guessObjectId: game.state.guessObjectsIds[currentIndex + 1],
                playersGuesses: {},
            }

            // Update game and send to the room
            session.currentGame = game;
            await this.saveSession(session);
        }

        return session;
    }

    ///////////////////////
    // Connection method //
    ///////////////////////

    async reconnectPlayer(socketID: string, sessionID: string, playerID: string, user: any) {
        return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {

            // Récupération du jeu dans la base de données
            const session: Session | null = await this.getSession(sessionID);
            if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found` });

            // Get players
            const players = session.players as OnlinePlayer[];

            // Check si l'id du joueur est dans la session
            const playerIndex = players.findIndex((player: any) => player.username === playerID);
            if (playerIndex === -1) throw new NotFoundException({ code: ErrorCode.SESSION_PLAYER_NOT_FOUND, message: `Player not found in session` });

            // Prevent non-accounts player to usurpate user accounts
            const player = players[playerIndex];
            if (!user && !player.isGuest) throw new UnauthorizedException({ code: ErrorCode.USER_INVALID_CREDENTIALS, message: 'Invalid or missing user token' });

            // Register new player socket
            await this.playerService.save(socketID, playerID, sessionID, user ? false : true);

            // Reconnexion du joueur
            players[playerIndex].connected = true;

            // Check host
            if (session.hostID === '') session.hostID = playerID;

            await this.saveSession(session);
            return session;
        });
    }

    async disconnectPlayer(socketID: string): Promise<Session | undefined> {

        // Récupération du joueur
        const player = await this.playerService.getPlayer(socketID);
        if (!player) return;

        const { playerID, sessionID } = player;

        return await this.lockService.withLock(this.getKey(sessionID), this.LOCK_TTL, async () => {

            // Récupération du jeu dans la base de données
            const session: Session | null = await this.getSession(sessionID)
            if (!session) throw new NotFoundException({ code: ErrorCode.SESSION_NOT_FOUND, message: `Session not found` });

            // Check si l'id du joueur est dans la partie
            const playerIndex = session.players.findIndex((player: any) => player.username === playerID);
            if (playerIndex === -1) throw new NotFoundException({ code: ErrorCode.SESSION_PLAYER_NOT_FOUND, message: `Player not found in session` });

            // Déconnexion du joueur
            (session.players[playerIndex] as OnlinePlayer).connected = false;

            // Update host
            const isHost = playerID === session.hostID;
            if (isHost) {
                const players = session.players;

                const connectedPlayers = players.filter((player: any) => player.connected && player.username !== playerID);
                if (connectedPlayers.length > 0) {
                    session.hostID = connectedPlayers[0].username;
                } else {
                    session.hostID = '';
                }
            }

            // Update states
            await this.playerService.deletePlayer(socketID);
            await this.saveSession(session);

            return session;
        });
    }

    ///////////
    // Store //
    ///////////

    // Redis
    private async getSession(sessionID: string): Promise<Session | null> {
        return await this.redisService.getJSON<Session>(this.getKey(sessionID));
    }

    private async saveSession(session: Session, ttl: number = this.TTL): Promise<void> {
        await this.redisService.setJSON(this.getKey(session.id), session, ttl);
    }

    private async deleteSession(sessionID: string): Promise<void> {
        await this.redisService.del(this.getKey(sessionID));
    }


    //////////////////////
    // Private function //
    //////////////////////

    private async endGame(session: Session, game: Game): Promise<void> {
        try {
            // Store game in database
            await this.prisma.gameRecord.create({
                data: {
                    mode: session.mode,
                    gameConfig: session.gameConfig as unknown as Prisma.InputJsonValue,
                    players: session.players as unknown as Prisma.InputJsonValue,
                    guessObjectsIds: game.state.guessObjectsIds,
                    results: game.state.results as unknown as Prisma.InputJsonValue,
                    users: {
                        connect: session.players
                            .filter(player => !player.isGuest)
                            .map(player => ({ id: player.id }))
                    }
                }
            });
        } catch (error) {
            this.logger.error(`Error storing game in db: ${error}`)
        }
    }

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

            lightSession = {
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
