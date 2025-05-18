import { GameStore } from "../stores/gameStore.ts";
import { PlayerService } from "./playerService.ts";

export class GameService {

    private gameStore: GameStore;
    private playerService: PlayerService;

    constructor(gameStore: GameStore) {
        this.gameStore = gameStore;
        this.playerService = this.playerService;
    }

    async getGame(gameID: string) {
        try {
            const game = await this.gameStore.getGame(gameID);
            if (!game) {
                throw new Error("Partie introuvable.");
            }
            return game;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération de la partie ${gameID}: ${error}`);
        }
    }

    async join(socketID: string, gameID: string, playerID: string) {
        try {
            // Récupération du jeu dans la base de données
            let game = await this.gameStore.getGame(gameID);

            // Check si la partie existe
            if (!game) throw new Error("Partie introuvable.");

            // Vérifier si playerID existe dans la liste des joueurs
            const playerIndex = game.players.findIndex((player: any) => player.id === playerID);
            if (playerIndex === -1) throw new Error("Le joueur n'est pas invité dans la partie.");

            // Vérifier que le joueur n'est pas déjà dans la partie
            if (game.players[playerIndex].connected === true) throw new Error(`Le joueur est déjà dans la partie`);

            // Ajouter le joueur à la partie
            game.players[playerIndex].connected = true;

            await this.gameStore.saveGame(game)

            // Check si tous les joueurs ont join
            const disconnectPlayers = game.player.some(player => !player.connected);
            if (!disconnectPlayers) {
                game = await this.startGame(game);
            }

            return game;
        } catch (error) {
            throw new Error(`Erreur lors de la connexion de ${playerID} dans la partie ${gameID}: ${error}`);
        }
    }

    async leave(socketID: string) {
        return await this.disconnectPlayer(socketID);
    }

    async handleGuess(socketID: string, guess: any) {
        try {

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
                if (Object.keys(game.state.currentRound.playersGuesses).length === connectedPlayers.length) {
                    game.state.currentRound.status = 'SHOWING_RESULTS'
                }

                await this.gameStore.saveGame(game);
            }
            return game;
        } catch (error) {
            throw new Error(`Erreur lors de l'enregistrement du guess de ${playerID} dans la partie ${gameID}: ${error}`);
        }
    }

    async handleNextRound(socketID: string) {
        try {
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
            const currentIndex = game.state.guessObjectsIds.findIndex((id: string) => id === game.currentRound.guessObjectId);

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

                game.state.results[player.id] = playerResults ? playerResults.results.push(newResult) : { results: [newResult] };
            });

            // Go to next guess object
            if (currentIndex + 1 >= game.state.guessObjectsIds.length) {
                game.status = 'IN_RESULTS'
                game.state.currentRound = undefined
            } else {
                game.currentRound = {
                    status: 'GUESSING',
                    guessObjectId: game.state.guessObjectsIds[currentIndex + 1],
                    playersGuesses: {},
                }
            }

            // Update game and send to the room
            await this.gameStore.saveGame(game);

            return game;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Impossible passer au round suivant: ${error.message}`);
            } else {
                throw new Error(`Erreur lors du passage au round suivant dans la partie ${gameID}: ${error}`);
            }
        }
    }

    async endGame(socketID: string) {
        try {
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
            if (error instanceof Error) {
                throw new Error(`Impossible supprimer la partie ${gameID}: ${error.message}`);
            } else {
                throw new Error(`Erreur lors de la suppression de la partie ${gameID}: ${error}`);
            }
        }
    }

    // private functions
    private async startGame(game: any) {
        try {
            // Sélection du premier objet à deviner
            const firstObjectId = game.guessObjectsIds[0];

            // Création du premier round
            const firstRound = {
                status: 'GUESSING',
                guessObjectId: firstObjectId,
                playersGuesses: {},
            };

            game.status = 'IN_GAME';
            game.currentRound = firstRound;

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
            const response = await fetch('/api/game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gameConfig: session.gameConfig, playersID }),
            });
            const game = await response.json();

            // Set host
            game.hostID = session.hostID;

            // Store in redis
            await this.gameStore.saveGame(game);

            return game;
        } catch (e) {
            throw new Error(`Error creating new game for session ${session.id}`);
        }
    }

    async disconnectPlayer(gameID: string, playerID: string, newHostID?: string) {
        try {
            // Récupération du jeu dans la base de données
            const game = await this.gameStore.getGame(gameID);

            // Check si la partie existe
            if (!game) throw new Error("Partie introuvable.");

            // Vérifier si playerID existe dans la liste des joueurs
            const playerIndex = game.players.findIndex((player: any) => player.id === playerID);
            if (playerIndex === -1) throw new Error("Le joueur n'est pas dans la partie.");

            // Déconnecter le joueur
            game.players[playerIndex].connected = false;

            // Update l'état de la game si nécessaire
            if (game.status === 'IN_GAME' && game.state.currentRound) {
                switch (game.currentRound) {
                    case 'GUESSING':
                        // Vérifier si tout le monde à guess
                        const connectedPlayers = game.players.filter((player: any) => player.connected);
                        if (Object.keys(game.state.currentRound.playersGuesses).length === connectedPlayers.length) {
                            game.state.currentRound.status = 'SHOWING_RESULTS'
                        }
                        break;
                    case 'RESULTS':
                        break;
                }
            }

            return game;
        } catch (error) {
            throw new Error(`Erreur lors de la déconnexion de ${playerID} dans la partie ${gameID}: ${error}`);
        }
    }

    async reconnectPlayer(gameID: string, playerID: string) {
        return await this.join(gameID, playerID);
    }
}

