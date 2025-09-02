// import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
// import { CreateGameDto } from './dto/create-game.dto';
// import { defaultGuess, Game, GameConfig, GameMode, GameStatus, GuessObject, OnlinePlayer, Player, Round, RoundStatus, Session } from '@cityborn/types';
// import { GuessObjectService } from 'src/guess-object/guess-object.service';
// import { IdService } from 'src/id/id.service';
// import { PlayerService } from 'src/player/player.service';
// import { LockService } from 'src/lock/lock.service';
// import { RedisService } from 'src/redis/redis.service';
// import { ErrorCode } from '@cityborn/errors';

// @Injectable()
// export class GameService {
//     private readonly prefix = 'game:';
//     private readonly TTL = 30 * 60; // seconds
//     private readonly LOCK_TTL = 2000;
//     private readonly logger = new Logger(GameService.name);

//     constructor(
//         private readonly redisService: RedisService,
//         private readonly guessObjectService: GuessObjectService,
//         private readonly idService: IdService,
//         private readonly playerService: PlayerService,
//         private readonly lockService: LockService
//     ) { }

//     private getKey(id: string): string {
//         return `${this.prefix}${id}`;
//     }

//     async create(dto: CreateGameDto): Promise<Game> {
//         const { gameConfig, hostID, gameMode, playersID } = dto;

//         // Fetch guess objects
//         const fetchedGuessObjects = await this.guessObjectService.findByGameConfig(gameConfig);

//         let newGame: Game;

//         switch (gameMode) {
//             case GameMode.SOLO:
//                 newGame = await this.createSoloGame(gameConfig, hostID, fetchedGuessObjects);
//                 break;

//             case GameMode.MULTI:
//                 newGame = await this.createMultiGame(gameConfig, hostID, playersID, fetchedGuessObjects);
//                 break;
//         }

//         if (newGame.mode === GameMode.MULTI) await this.saveGame(this.getLightGame(newGame));

//         return newGame;
//     }

//     async get(gameId: string): Promise<Game> {
//         const game = await this.getGame(gameId);

//         if (!game) throw new NotFoundException({ code: ErrorCode.GAME_NOT_FOUND, message: `Game ${gameId} not found.` });

//         game.state.guessObjects = await this.guessObjectService.findSome(game.state.guessObjectsIds);

//         return game;
//     }

//     async join(socketID: string, gameID: string) {

//         // Récupération du joueur
//         const player = await this.playerService.getPlayer(socketID);
//         if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with socket ${socketID}` });

//         const { playerID, sessionID } = player;

//         return await this.lockService.withLock(this.getKey(gameID), this.LOCK_TTL, async () => {

//             // Récupération du jeu dans la base de données
//             let game = await this.getGame(gameID);

//             // Check si la partie existe
//             if (!game) throw new NotFoundException({ code: ErrorCode.GAME_NOT_FOUND, message: `Game ${gameID} not found` });

//             // Vérifier si playerID existe dans la liste des joueurs
//             const playerIndex = game.players.findIndex((player: OnlinePlayer) => player.id === playerID);
//             if (playerIndex === -1) throw new UnauthorizedException({ code: ErrorCode.GAME_PLAYER_NOT_INVITED, message: `Player ${playerID} not invited in the game` });

//             // Vérifier que le joueur n'est pas déjà dans la partie
//             if ((game.players as OnlinePlayer[])[playerIndex].connected! === true) {
//                 throw new UnauthorizedException({ code: ErrorCode.GAME_PLAYER_ALREADY_IN_GAME, message: `Player ${playerID} is already in the game` });
//             }

//             // Update player
//             await this.playerService.save(socketID, playerID, sessionID, gameID);

//             // Ajouter le joueur à la partie
//             (game.players as OnlinePlayer[])[playerIndex].connected = true;

//             // Save game
//             await this.saveGame(game)

//             // Check si tous les joueurs ont join
//             const disconnectPlayers = (game.players as OnlinePlayer[]).some(player => !player.connected);
//             if (!disconnectPlayers && game.status === GameStatus.STARTING) {
//                 game = await this.startGame(game);
//             }

//             return game;
//         });
//     }

//     async handleGuess(socketID: string, guess: any) {
//         // Récupération du joueur
//         const player = await this.playerService.getPlayer(socketID);
//         if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with socket ${socketID}` });

//         const { playerID, gameID } = player;
//         if (!gameID) throw new NotFoundException({ code: ErrorCode.PLAYER_NO_GAME_ASSOCIATION, message: `Player of socket ${socketID} not associated with any game` });

//         return await this.lockService.withLock(this.getKey(gameID), this.LOCK_TTL, async () => {
//             // Récupération du jeu dans la base de données
//             const game = await this.getGame(gameID);

//             // Check si la partie existe
//             if (!game) throw new NotFoundException({ code: ErrorCode.GAME_NOT_FOUND, message: `Game ${gameID} not found` });

//             // Vérifier si playerID existe dans la liste des joueurs (game.players)
//             const playerExists = game.players.some((player: any) => player.id === playerID);
//             if (!playerExists) throw new NotFoundException({ code: ErrorCode.GAME_PLAYER_NOT_FOUND, message: `Player ${playerID} not found in game ${gameID}` })

//             // Vérifier si playerID est connecté
//             const playerConnected = game.players.some((player: any) => player.id === playerID && player.connected);
//             if (!playerConnected) throw new UnauthorizedException({ code: ErrorCode.GAME_PLAYER_NOT_CONNECTED, message: `Player ${playerID} is not connected to the game` });

//             // Vérifier si un round est actif
//             if (!game.state.currentRound) throw new UnauthorizedException({ code: ErrorCode.GAME_NO_ACTIVE_ROUND, message: `No active round on game ${gameID}` })

//             if (game.state.currentRound.playersGuesses && !game.state.currentRound.playersGuesses[playerID]) {
//                 // Mettre à jour le guess du joueur dans currentRound.playersGuesses
//                 game.state.currentRound.playersGuesses[playerID] = guess;

//                 // Vérifier si tout le monde à guess
//                 const connectedPlayers = game.players.filter((player: any) => player.connected);
//                 const allConnectedPlayersGuessed = connectedPlayers.every((player: any) =>
//                     game.state.currentRound!.playersGuesses!.hasOwnProperty(player.id)
//                 );
//                 if (allConnectedPlayersGuessed) {
//                     // Add null guesses
//                     for (const player of game.players) {
//                         if (!game.state.currentRound.playersGuesses[player.id]) {
//                             game.state.currentRound.playersGuesses[player.id] = defaultGuess;
//                         }
//                     }

//                     // Update game status
//                     game.state.currentRound.status = RoundStatus.SHOWING_RESULTS;
//                 }

//                 await this.saveGame(game);
//             }
//             return game;
//         });
//     }

//     async handleNextRound(socketID: string) {
//         // Récupération du joueur
//         const player = await this.playerService.getPlayer(socketID);
//         if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with socket ${socketID}` });

//         const { playerID, gameID } = player;
//         if (!gameID) throw new NotFoundException({ code: ErrorCode.PLAYER_NO_GAME_ASSOCIATION, message: `Player of socket ${socketID} not associated with any game` });

//         // Récupération du jeu dans la base de données
//         const game = await this.getGame(gameID);

//         // Check si la partie existe
//         if (!game) throw new NotFoundException({ code: ErrorCode.GAME_NOT_FOUND, message: `Game ${gameID} not found` });

//         // Vérifier que le host
//         if (game.hostID !== playerID) {
//             throw new UnauthorizedException({ code: ErrorCode.GAME_FORBIDDEN_HOST, message: `Player ${playerID} is not the host of the game ${gameID}` });
//         }

//         // Trouver l'index du currentRound
//         const currentIndex = game.state.guessObjectsIds.findIndex((id: string) => id === game.state.currentRound!.guessObjectId);

//         // Register result
//         game.players.forEach((player: any) => {
//             const guess = game.state.currentRound!.playersGuesses![player.id];
//             const playerResults = game.state.results[player.id];

//             const newResult = {
//                 guessObjectId: game.state.currentRound?.guessObjectId ?? '',
//                 distance: guess ? guess.distance : -1,
//                 points: guess ? guess.points : 0
//             };

//             if (playerResults && playerResults.results) {
//                 playerResults.results.push(newResult);
//             } else {
//                 game.state.results[player.id] = { results: [newResult] };
//             }
//         });


//         // Go to next guess object
//         if (currentIndex + 1 >= game.state.guessObjectsIds.length) {
//             game.status = GameStatus.IN_RESULTS;
//             //game.state.currentRound = undefined
//         } else {
//             game.state.currentRound = {
//                 status: RoundStatus.GUESSING,
//                 guessObjectId: game.state.guessObjectsIds[currentIndex + 1],
//                 playersGuesses: {},
//             }
//         }

//         // Update game and send to the room
//         await this.saveGame(game);

//         return game;
//     }

//     async endGame(socketID: string) {
//         // Récupération du joueur
//         const player = await this.playerService.getPlayer(socketID);
//         if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with socket ${socketID}` });

//         const { playerID, gameID } = player
//         if (!gameID) throw new NotFoundException({ code: ErrorCode.PLAYER_NO_GAME_ASSOCIATION, message: `Player of socket ${socketID} not associated with any game` });

//         // Récupération du jeu dans la base de données
//         const game = await this.getGame(gameID)

//         // Check si la partie existe
//         if (!game) throw new NotFoundException({ code: ErrorCode.GAME_NOT_FOUND, message: `Game ${gameID} not found` });

//         // Vérifier que le host
//         if (game.hostID !== playerID) {
//             throw new UnauthorizedException({ code: ErrorCode.GAME_FORBIDDEN_HOST, message: `Player ${playerID} is not the host of the game ${gameID}` });
//         }

//         await this.deleteGame(gameID);

//         // To change later
//         return game;
//     }

//     async reconnectPlayer(socketID: string, gameID: string) {
//         return await this.join(socketID, gameID);
//     }

//     async disconnectPlayer(socketID: string, newHostID: string) {
//         // Récupération du joueur
//         const player = await this.playerService.getPlayer(socketID);
//         if (!player) throw new NotFoundException({ code: ErrorCode.PLAYER_NOT_FOUND, message: `No player associated with socket ${socketID}` });

//         const { playerID, gameID } = player
//         if (!gameID) throw new NotFoundException({ code: ErrorCode.PLAYER_NO_GAME_ASSOCIATION, message: `Player of socket ${socketID} not associated with any game` });

//         return await this.lockService.withLock(this.getKey(gameID), this.LOCK_TTL, async () => {

//             // Récupération du jeu dans la base de données
//             const game = await this.getGame(gameID);

//             // Check si la partie existe
//             if (!game) throw new NotFoundException({ code: ErrorCode.GAME_NOT_FOUND, message: `Game ${gameID} not found` });

//             // Vérifier si playerID existe dans la liste des joueurs
//             const playerIndex = game.players.findIndex((player: any) => player.id === playerID);
//             if (playerIndex === -1) throw new UnauthorizedException({ code: ErrorCode.GAME_PLAYER_NOT_FOUND, message: `Player ${playerID} not found in the game ${gameID}` });

//             // Déconnecter le joueur
//             (game.players[playerIndex] as OnlinePlayer).connected = false;

//             // Update host
//             if (newHostID) game.hostID = newHostID;

//             // Update l'état de la game si nécessaire
//             if (game.status === 'IN_GAME' && game.state.currentRound) {
//                 switch (game.state.currentRound.status) {
//                     case RoundStatus.GUESSING:
//                         // Vérifier si tout le monde à guess
//                         const connectedPlayers = game.players.filter((player: any) => player.connected);
//                         const allConnectedPlayersGuessed = connectedPlayers.every((player: any) =>
//                             game.state.currentRound!.playersGuesses!.hasOwnProperty(player.id)
//                         );

//                         if (allConnectedPlayersGuessed) game.state.currentRound.status = RoundStatus.SHOWING_RESULTS;
//                         break;
//                     case RoundStatus.SHOWING_RESULTS:
//                         break;
//                 }
//             }

//             await this.saveGame(game);
//             return game;
//         });
//     }


//     ///////////
//     // Store //
//     ///////////

//     private async getGame(gameID: string): Promise<Game | null> {
//         return await this.redisService.getJSON<Game>(this.getKey(gameID));
//     }

//     private async saveGame(game: Game, ttl: number = this.TTL): Promise<void> {
//         await this.redisService.setJSON(this.getKey(game.id), game, ttl);
//     }

//     private async deleteGame(gameID: string): Promise<void> {
//         await this.redisService.del(this.getKey(gameID));
//     }

//     /////////////////////////
//     // Auxiliary functions //
//     /////////////////////////

//     private async createSoloGame(gameConfig: GameConfig, hostID: string, guessObjects: GuessObject[]): Promise<Game> {
//         const players: Player[] = [{
//             id: hostID
//         }]

//         const newSoloGame: Game = {
//             id: await this.generateGameId(),
//             hostID: hostID,
//             mode: GameMode.SOLO,
//             status: GameStatus.STARTING,
//             gameConfig,
//             players: players,
//             state: {
//                 guessObjectsIds: guessObjects.map(obj => obj.id),
//                 currentRound: undefined,
//                 results: {},
//                 guessObjects
//             }
//         }

//         return newSoloGame;
//     }

//     private async createMultiGame(gameConfig: GameConfig, hostID: string, playersID: string[], guessObjects: GuessObject[]): Promise<Game> {
//         const players: Player[] = playersID.map((playerID) => {
//             return { id: playerID, connected: false }
//         });

//         const newMultiGame: Game = {
//             id: await this.generateGameId(),
//             hostID: hostID,
//             mode: GameMode.MULTI,
//             status: GameStatus.STARTING,
//             gameConfig,
//             players: players,
//             state: {
//                 guessObjectsIds: guessObjects.map(obj => obj.id),
//                 currentRound: undefined,
//                 results: {},
//                 guessObjects
//             }
//         }

//         return newMultiGame;
//     }

//     private async startGame(game: Game) {
//         // Sélection du premier objet à deviner
//         const firstObjectId = game.state.guessObjectsIds[0];

//         // Création du premier round
//         const firstRound: Round = {
//             status: RoundStatus.GUESSING,
//             guessObjectId: firstObjectId,
//             playersGuesses: {},
//         };

//         game.status = GameStatus.IN_GAME;
//         game.state.currentRound = firstRound;

//         await this.saveGame(game)

//         return game;
//     }

//     private getLightGame(game: Game): Game {
//         const { guessObjects, ...restState } = game.state;

//         const lightGame: Game = {
//             ...game,
//             state: {
//                 ...restState,
//             },
//         };

//         return lightGame;
//     }

//     async generateGameId(): Promise<string> {
//         const MAX_ATTEMPTS = 3;

//         for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
//             const candidateId = this.idService.generateUniqueNamesId();
//             if (!(await this.getGame(candidateId))) return candidateId.toString();
//         }

//         throw new InternalServerErrorException({ code: ErrorCode.GAME_CREATION_FAILED, message: 'Max id generation attempt reached' });
//     }
// }