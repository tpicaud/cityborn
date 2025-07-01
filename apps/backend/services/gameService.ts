import { GameStatus, type OnlinePlayer, RoundStatus } from "@cityborn/types";
import { GameStore } from "../stores/gameStore.js";
import { LockService } from "./lockService.js";
import { PlayerService } from "./playerService.js";

export class GameService {

    private gameStore: GameStore;
    private playerService: PlayerService;
    private lockService: LockService;
    private LOCK_TTL = 2000;

    constructor(gameStore: GameStore, playerService: PlayerService, lockService: LockService) {
        this.gameStore = gameStore;
        this.playerService = playerService;
        this.lockService = lockService;
    }

    async getGame(gameID: string) {
        try {
            return await this.gameStore.getGame(gameID);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération de la partie ${gameID}: ${error}`);
        }
    }

    async join(socketID: string, gameID: string) {
        try {
            // Récupération du joueur
            const { playerID, sessionID } = await this.playerService.getPlayer(socketID);
            if (!playerID || !sessionID) throw new Error(`Aucun joueur associé au socket ${socketID}. Rejoingnez d'abord la session.`);

            return await this.lockService.withLock(this.gameStore.key(gameID), this.LOCK_TTL, async () => {

                // Récupération du jeu dans la base de données
                let game = await this.gameStore.getGame(gameID);

                // Check si la partie existe
                if (!game) throw new Error("Partie introuvable.");

                // Vérifier si playerID existe dans la liste des joueurs
                const playerIndex = game.players.findIndex((player: OnlinePlayer) => player.id === playerID);
                if (playerIndex === -1) throw new Error("Le joueur n'est pas invité dans la partie.");

                // Vérifier que le joueur n'est pas déjà dans la partie
                if ((game.players as OnlinePlayer[])[playerIndex].connected! === true) throw new Error(`Le joueur est déjà dans la partie`);

                // Update player
                await this.playerService.register(socketID, playerID, sessionID, gameID);

                // Ajouter le joueur à la partie
                (game.players as OnlinePlayer[])[playerIndex].connected = true;

                // Save game
                await this.gameStore.saveGame(game)

                // Check si tous les joueurs ont join
                const disconnectPlayers = (game.players as OnlinePlayer[]).some(player => !player.connected);
                if (!disconnectPlayers) {
                    game = await this.startGame(game);
                }

                return game;
            });
        } catch (error) {
            throw new Error(`Erreur lors de la connexion du socket ${socketID} dans la partie ${gameID}: ${error}`);
        }
    }

    async handleGuess(socketID: string, guess: any) {
        try {
            // Récupération du joueur
            const { playerID, gameID } = await this.playerService.getPlayer(socketID);
            if (!playerID || !gameID) throw new Error(`Aucun joueur valide associé au socket ${socketID}`);


            return await this.lockService.withLock(this.gameStore.key(gameID), this.LOCK_TTL, async () => {
                // Récupération du jeu dans la base de données
                const game = await this.gameStore.getGame(gameID);

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

                if (!game.state.currentRound.playersGuesses[playerID]) {
                    // Mettre à jour le guess du joueur dans currentRound.playersGuesses
                    game.state.currentRound.playersGuesses[playerID] = guess;

                    // Vérifier si tout le monde à guess
                    const connectedPlayers = game.players.filter((player: any) => player.connected);
                    const allConnectedPlayersGuessed = connectedPlayers.every((player: any) =>
                        game.state.currentRound.playersGuesses.hasOwnProperty(player.id)
                    );
                    if (allConnectedPlayersGuessed) game.state.currentRound.status = RoundStatus.SHOWING_RESULTS;

                    await this.gameStore.saveGame(game);
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
            const { playerID, sessionID, gameID } = await this.playerService.getPlayer(socketID);
            if (!playerID || !sessionID || !gameID) throw new Error(`Aucun joueur valide associé au socket ${socketID}`);

            // Récupération du jeu dans la base de données
            const game = await this.gameStore.getGame(gameID);

            if (!game) {
                throw new Error("Partie introuvable.");
            }

            // Vérifier que le host
            if (game.hostID !== playerID) {
                throw new Error("Le joueur n'est pas le host de la partie.");
            }

            // Trouver l'index du currentRound
            const currentIndex = game.state.guessObjectsIds.findIndex((id: string) => id === game.state.currentRound.guessObjectId);

            // Vérifier que l'objet est dans la liste
            if (currentIndex === undefined) {
                throw new Error("L'objet à deviner ne fais pas partie de la liste de la partie");
            }

            // Register result
            game.players.forEach((player: any) => {
                const guess = game.state.currentRound?.playersGuesses[player.id];
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
            await this.gameStore.saveGame(game);

            return game;
        } catch (error) {
            throw new Error(`Erreur lors du passage au round suivant dans la partie: ${error}`);
        }
    }

    async endGame(socketID: string) {
        try {
            // Récupération du joueur
            const { playerID, sessionID, gameID } = await this.playerService.getPlayer(socketID);
            if (!playerID || !sessionID || !gameID) throw new Error(`Aucun joueur valide associé au socket ${socketID}`);

            // Récupération du jeu dans la base de données
            const game = await this.gameStore.getGame(gameID)

            if (!game) {
                throw new Error("Partie introuvable.");
            }

            // Vérifier le host
            if (game.hostID !== playerID) {
                throw new Error("Le joueur n'est pas le host de la partie.");
            }

            await this.gameStore.deleteGame(gameID);

            // To change later
            return game;

        } catch (error) {
            throw new Error(`Erreur lors de la suppression de la partie par le socket ${socketID}: ${error}`);
        }
    }

    async reconnectPlayer(socketID: string, gameID: string) {
        return await this.join(socketID, gameID);
    }

    ////////////////////////////////////////

    private async startGame(game: any) {
        try {
            // Sélection du premier objet à deviner
            const firstObjectId = game.state.guessObjectsIds[0];

            // Création du premier round
            const firstRound = {
                status: 'GUESSING',
                guessObjectId: firstObjectId,
                playersGuesses: {},
            };

            game.status = 'IN_GAME';
            game.state.currentRound = firstRound;

            await this.gameStore.saveGame(game)

            return game;
        } catch (error) {
            throw new Error(`Erreur lors du démarrage de la partie ${game.id}: ${error}`);
        }
    }

    ///////////////////////////////////
    // Call from SessionService only //
    ///////////////////////////////////

    async createGameFromSession(session: any) {
        try {
            const playersID = session.players.map(player => player.id);
            console.log(process.env.INTERNAL_API_SECRET);
            const response = await fetch(`${process.env.API_REST_URL}/game/multi`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`
                },
                body: JSON.stringify({
                    gameConfig: session.gameConfig,
                    hostID: session.hostID,
                    gameMode: session.gameMode,
                    playersID,
                }),
            });

            // Vérifie si la réponse est OK
            if (!response.ok) {
                const errorText = await response.text(); // Récupère le corps brut même s'il n'est pas JSON
                throw new Error(`HTTP ${response.status} - ${response.statusText}: ${errorText}`);
            }

            const data = await response.json();
            const game = data.game;

            // Set host
            game.hostID = session.hostID;

            return game;
        } catch (error) {
            throw new Error(`Erreur lors de la création de la partie pour la session ${session.id}: ${error}`);
        }
    }


    async disconnectPlayer(socketID: string, newHostID: string) {
        try {
            // Récupération du joueur
            const { playerID, sessionID, gameID } = await this.playerService.getPlayer(socketID);
            if (!playerID || !sessionID || !gameID) throw new Error(`Aucun joueur valide associé au socket ${socketID}`);

            return await this.lockService.withLock(this.gameStore.key(gameID), this.LOCK_TTL, async () => {

                // Récupération du jeu dans la base de données
                const game = await this.gameStore.getGame(gameID);

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
                                game.state.currentRound.playersGuesses.hasOwnProperty(player.id)
                            );

                            if (allConnectedPlayersGuessed) game.state.currentRound.status = RoundStatus.SHOWING_RESULTS;
                            break;
                        case RoundStatus.SHOWING_RESULTS:
                            break;
                    }
                }

                await this.gameStore.saveGame(game);
                return game;
            });
        } catch (error) {
            throw new Error(`Erreur lors de la deconnexion du socket ${socketID} dans la partie`);
        }
    }
}

