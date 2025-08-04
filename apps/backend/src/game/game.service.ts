import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { defaultGuess, Game, GameConfig, GameMode, GameStatus, GuessObject, OnlinePlayer, Player, Round, RoundStatus, Session } from '@cityborn/types';
import { GuessObjectService } from 'src/guess-object/guess-object.service';
import { IdService } from 'src/id/id.service';
import { PlayerService } from 'src/player/player.service';
import { LockService } from 'src/lock/lock.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class GameService {
    private readonly prefix = 'game:';
    private readonly TTL = 30 * 60 * 1000
    private readonly LOCK_TTL = 2000;
    private readonly logger = new Logger(GameService.name);


    constructor(
        private readonly redisService: RedisService,
        private readonly guessObjectService: GuessObjectService,
        private readonly idService: IdService,
        private readonly playerService: PlayerService,
        private readonly lockService: LockService
    ) { }

    private getKey(id: string): string {
        return `${this.prefix}${id}`;
    }

    async create(dto: CreateGameDto): Promise<Game> {
        const { gameConfig, hostID, gameMode, playersID } = dto;

        try {
            // Fetch guess objects
            const fetchedGuessObjectsIds = await this.guessObjectService.findByGameConfig(gameConfig);

            let newGame: Game;

            switch (gameMode) {
                case GameMode.SOLO:
                    newGame = await this.createSoloGame(gameConfig, hostID, fetchedGuessObjectsIds);
                    break;

                case GameMode.MULTI:
                    newGame = await this.createMultiGame(gameConfig, hostID, playersID, fetchedGuessObjectsIds);
                    break;

                default:
                    throw new Error(`Unsupported game mode: ${gameMode}`);
            }

            if (newGame.mode === GameMode.MULTI) await this.saveGame(this.getLightGame(newGame));

            return newGame;
        } catch (error) {
            //this.logger.error('Error while creating game:', error.message);
            throw new Error(`An error occurred while creating the game.: ${error.message}`);
        }
    }


    async get(gameId: string): Promise<Game> {
        try {
            const game = await this.getGame(gameId);

            if (!game) throw new NotFoundException(`Session with ID "${gameId}" not found.`);

            game.state.guessObjects = await this.guessObjectService.findSome(game.state.guessObjectsIds);

            return game;
        } catch (error) {
            throw new Error(`Failed to retrieve game: ${error.message}`);
        }
    }


    async join(socketID: string, gameID: string) {
        try {
            // Récupération du joueur
            const player = await this.playerService.getPlayer(socketID);
            if (!player) throw new Error(`No player associated with socket ${socketID}`);

            const { playerID, sessionID } = player;
            if (!playerID || !sessionID) throw new Error(`Aucun joueur valide associé au socket ${socketID}`);


            return await this.lockService.withLock(this.getKey(gameID), this.LOCK_TTL, async () => {

                // Récupération du jeu dans la base de données
                let game = await this.getGame(gameID);

                // Check si la partie existe
                if (!game) throw new Error("Partie introuvable.");

                // Vérifier si playerID existe dans la liste des joueurs
                const playerIndex = game.players.findIndex((player: OnlinePlayer) => player.id === playerID);
                if (playerIndex === -1) throw new Error("Le joueur n'est pas invité dans la partie.");

                // Vérifier que le joueur n'est pas déjà dans la partie
                if ((game.players as OnlinePlayer[])[playerIndex].connected! === true) throw new Error(`Le joueur est déjà dans la partie`);

                // Update player
                await this.playerService.save(socketID, playerID, sessionID, gameID);

                // Ajouter le joueur à la partie
                (game.players as OnlinePlayer[])[playerIndex].connected = true;

                // Save game
                await this.saveGame(game)

                // Check si tous les joueurs ont join
                const disconnectPlayers = (game.players as OnlinePlayer[]).some(player => !player.connected);
                if (!disconnectPlayers && game.status === GameStatus.STARTING) {
                    game = await this.startGame(game);
                }

                return game;
            });
        } catch (error) {
            throw new Error(`Erreur lors de la connexion du socket ${socketID} dans la partie ${gameID}: ${error.message}`);
        }
    }

    async handleGuess(socketID: string, guess: any) {
        try {
            // Récupération du joueur
            const player = await this.playerService.getPlayer(socketID);
            if (!player) throw new Error(`No player associated with socket ${socketID}`);

            const { playerID, gameID } = player;
            if (!playerID || !gameID) throw new Error(`Aucun joueur valide associé au socket ${socketID}`);

            return await this.lockService.withLock(this.getKey(gameID), this.LOCK_TTL, async () => {
                // Récupération du jeu dans la base de données
                const game = await this.getGame(gameID);

                // Check si la partie existe
                if (!game) {
                    throw new Error("Partie introuvable.");
                }

                // Vérifier si playerID existe dans la liste des joueurs (game.players)
                const playerExists = game.players.some((player: any) => player.id === playerID);
                if (!playerExists) {
                    throw new Error("Le joueur n'est pas dans la partie.");
                }

                // Vérifier si playerID est connecté
                const playerConnected = game.players.some((player: any) => player.id === playerID && player.connected);
                if (!playerConnected) {
                    throw new Error("Le joueur est déconnecté.");
                }

                // Vérifier si un round est actif
                if (!game.state.currentRound) {
                    throw new Error("Aucun round actif.");
                }

                if (game.state.currentRound.playersGuesses && !game.state.currentRound.playersGuesses[playerID]) {
                    // Mettre à jour le guess du joueur dans currentRound.playersGuesses
                    game.state.currentRound.playersGuesses[playerID] = guess;

                    // Vérifier si tout le monde à guess
                    const connectedPlayers = game.players.filter((player: any) => player.connected);
                    const allConnectedPlayersGuessed = connectedPlayers.every((player: any) =>
                        game.state.currentRound!.playersGuesses!.hasOwnProperty(player.id)
                    );
                    if (allConnectedPlayersGuessed) {
                        // Add null guesses
                        for (const player of game.players) {
                            if (!game.state.currentRound.playersGuesses[player.id]) {
                                game.state.currentRound.playersGuesses[player.id] = defaultGuess;
                            }
                        }

                        // Update game status
                        game.state.currentRound.status = RoundStatus.SHOWING_RESULTS;
                    }

                    await this.saveGame(game);
                }
                return game;
            });
        } catch (error) {
            throw new Error(`Erreur lors de l'enregistrement du guess de ${socketID}: ${error}`);
        }
    }

    async handleNextRound(socketID: string) {
        try {
            // Récupération du joueur
            const player = await this.playerService.getPlayer(socketID);
            if (!player) throw new Error(`No player associated with socket ${socketID}`);

            const { playerID, sessionID, gameID } = player;
            if (!playerID || !sessionID || !gameID) throw new Error(`Aucun joueur valide associé au socket ${socketID}`);

            // Récupération du jeu dans la base de données
            const game = await this.getGame(gameID);

            if (!game) {
                throw new Error("Partie introuvable.");
            }

            // Vérifier que le host
            if (game.hostID !== playerID) {
                throw new Error("Le joueur n'est pas le host de la partie.");
            }

            // Trouver l'index du currentRound
            const currentIndex = game.state.guessObjectsIds.findIndex((id: string) => id === game.state.currentRound!.guessObjectId);

            // Vérifier que l'objet est dans la liste
            if (currentIndex === undefined) {
                throw new Error("L'objet à deviner ne fais pas partie de la liste de la partie");
            }

            // Register result
            game.players.forEach((player: any) => {
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
                game.state.currentRound = undefined
            } else {
                game.state.currentRound = {
                    status: RoundStatus.GUESSING,
                    guessObjectId: game.state.guessObjectsIds[currentIndex + 1],
                    playersGuesses: {},
                }
            }

            // Update game and send to the room
            await this.saveGame(game);

            return game;
        } catch (error) {
            throw new Error(`Erreur lors du passage au round suivant dans la partie: ${error}`);
        }
    }

    async endGame(socketID: string) {
        try {
            // Récupération du joueur
            const player = await this.playerService.getPlayer(socketID);
            if (!player) throw new Error(`No player associated with socket ${socketID}`);

            const { playerID, sessionID, gameID } = player
            if (!playerID || !sessionID || !gameID) throw new Error(`Aucun joueur valide associé au socket ${socketID}`);

            // Récupération du jeu dans la base de données
            const game = await this.getGame(gameID)

            if (!game) {
                throw new Error("Partie introuvable.");
            }

            // Vérifier le host
            if (game.hostID !== playerID) {
                throw new Error("Le joueur n'est pas le host de la partie.");
            }

            await this.deleteGame(gameID);

            // To change later
            return game;

        } catch (error) {
            throw new Error(`Erreur lors de la suppression de la partie par le socket ${socketID}: ${error}`);
        }
    }

    async reconnectPlayer(socketID: string, gameID: string) {
        return await this.join(socketID, gameID);
    }

    async disconnectPlayer(socketID: string, newHostID: string) {
        try {
            // Récupération du joueur
            const player = await this.playerService.getPlayer(socketID);
            if (!player) throw new Error(`No player associated with socket ${socketID}`);

            const { playerID, sessionID, gameID } = player
            if (!playerID || !sessionID || !gameID) throw new Error(`Aucun joueur valide associé au socket ${socketID}`);

            return await this.lockService.withLock(this.getKey(gameID), this.LOCK_TTL, async () => {

                // Récupération du jeu dans la base de données
                const game = await this.getGame(gameID);

                // Check si la partie existe
                if (!game) throw new Error("Partie introuvable.");

                // Vérifier si playerID existe dans la liste des joueurs
                const playerIndex = game.players.findIndex((player: any) => player.id === playerID);
                if (playerIndex === -1) throw new Error("Le joueur n'est pas dans la partie.");

                // Déconnecter le joueur
                (game.players[playerIndex] as OnlinePlayer).connected = false;

                // Update host
                if (newHostID) game.hostID = newHostID;

                // Update l'état de la game si nécessaire
                if (game.status === 'IN_GAME' && game.state.currentRound) {
                    switch (game.state.currentRound.status) {
                        case RoundStatus.GUESSING:
                            // Vérifier si tout le monde à guess
                            const connectedPlayers = game.players.filter((player: any) => player.connected);
                            const allConnectedPlayersGuessed = connectedPlayers.every((player: any) =>
                                game.state.currentRound!.playersGuesses!.hasOwnProperty(player.id)
                            );

                            if (allConnectedPlayersGuessed) game.state.currentRound.status = RoundStatus.SHOWING_RESULTS;
                            break;
                        case RoundStatus.SHOWING_RESULTS:
                            break;
                    }
                }

                await this.saveGame(game);
                return game;
            });
        } catch (error) {
            throw new Error(`Erreur lors de la deconnexion du socket ${socketID} dans la partie`);
        }
    }


    ///////////
    // Store //
    ///////////

    private async getGame(gameID: string): Promise<Game> {
        try {
            const game = await this.redisService.getJSON<Game>(this.getKey(gameID));
            if (!game) throw new Error(`Game ${gameID} not found`);
            return game;
        } catch (error) {
            throw new Error(`Error getting game: ${error.message}`);
        }
    }

    private async saveGame(game: Game, ttl: number = this.TTL): Promise<void> {
        try {
            await this.redisService.setJSON(this.getKey(game.id), game, ttl);
        } catch (error) {
            throw new Error(`Error setting game ${game.id}: ${error.message}`);
        }
    }

    private async deleteGame(gameID: string): Promise<void> {
        try {
            await this.redisService.del(this.getKey(gameID));
        } catch (error) {
            throw new Error(`Error deleting game: ${gameID}: ${error.message}`);
        }
    }

    /////////////////////////
    // Auxiliary functions //
    /////////////////////////

    private async createSoloGame(gameConfig: GameConfig, hostID: string, guessObjectsIds: string[]): Promise<Game> {
        const players: Player[] = [{
            id: hostID
        }]

        const newSoloGame: Game = {
            id: await this.idService.generateSoloGameID(),
            hostID: hostID,
            mode: GameMode.SOLO,
            status: GameStatus.STARTING,
            gameConfig,
            players: players,
            state: {
                guessObjectsIds: guessObjectsIds,
                currentRound: undefined,
                results: {},
            }
        }

        return newSoloGame;
    }

    private async createMultiGame(gameConfig: GameConfig, hostID: string, playersID: string[], guessObjectsIds: string[]): Promise<Game> {
        const players: Player[] = playersID.map((playerID) => {
            return { id: playerID, connected: false }
        });

        const newMultiGame: Game = {
            id: await this.idService.generateMultiGameID(),
            hostID: hostID,
            mode: GameMode.MULTI,
            status: GameStatus.STARTING,
            gameConfig,
            players: players,
            state: {
                guessObjectsIds: guessObjectsIds,
                currentRound: undefined,
                results: {},
            }
        }

        return newMultiGame;
    }

    private async startGame(game: Game) {
        try {
            // Sélection du premier objet à deviner
            const firstObjectId = game.state.guessObjectsIds[0];

            // Création du premier round
            const firstRound: Round = {
                status: RoundStatus.GUESSING,
                guessObjectId: firstObjectId,
                playersGuesses: {},
            };

            game.status = GameStatus.IN_GAME;
            game.state.currentRound = firstRound;

            await this.saveGame(game)

            return game;
        } catch (error) {
            throw new Error(`Erreur lors du démarrage de la partie ${game.id}: ${error}`);
        }
    }

    private getLightGame(game: Game): Game {
        const { guessObjects, ...restState } = game.state;

        const lightGame: Game = {
            ...game,
            state: {
                ...restState,
            },
        };

        return lightGame;
    }

}