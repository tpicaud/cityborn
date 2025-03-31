import { Socket } from "socket.io";
import { addGame, getAllGames, getGame, removeGame, updateGame } from "./gamesStore.ts";

export async function postGame(socket: Socket, game: any) {
    try {
        if (getGame(game.id)) {
            throw new Error(`La partie ${game.id} existe déjà.`);
        }
        addGame(game)
        console.log(`Game ${game.id} posted. Current games playing: ${getAllGames().length}`)
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Impossible créer la partie ${game.id}: ${error.message}`);
        } else {
            throw new Error(`Erreur lors de la création de la partie ${game.id}: ${error}`);
        }
    }
}

export async function joinGame(socket: Socket, gameID: string, playerID: string) {
    try {

        // Récupération du jeu dans la base de données
        const game: any | undefined = getGame(gameID)

        if (!game) {
            throw new Error("Partie introuvable.");
        }

        // Check si l'id du joueur est déjà dans la partie
        const playerExists = game.players.some((player: any) => player.id === playerID);

        if (playerExists) {
            throw new Error("Le joueur est déjà dans la partie.");
        }

        // Check si la partie est déjà lancé
        if (game.status != 'IN_LOBBY') {
            throw new Error("La partie est déjà lancée.");
        }

        // Créer un nouveau joueur
        const newPlayer: any = { id: playerID, results: [], connected: true };

        if (game.players.length === 0) {
            game.hostID = playerID
        }
        game.players.push(newPlayer)

        // Update game and send to the room
        updateGame(game)
        const updatedGame = getGame(gameID);
        await socket.join(gameID)
        socket.to(gameID).emit('updatedGame', updatedGame);

        return updatedGame;

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Impossible de rejoindre la partie: ${error.message}`);
        } else {
            throw new Error(`Erreur lors de la connexion de ${playerID} à la partie ${gameID}: ${error}`);
        }
    }
}

export async function startGame(socket: Socket, gameID: string, playerID: string) {
    try {
        const game = getGame(gameID)

        // Check si la partie existe
        if (!game) {
            throw new Error("Partie introuvable.");
        }

        // Vérifier que le host
        if (game.hostID !== playerID) {
            throw new Error("Le joueur n'est pas le host de la partie.");
        }

        // Check si la partie est démarrable
        if (game.status !== 'IN_LOBBY') {
            throw new Error("La partie a déjà démarré.");
        }

        // Vérifier s'il y a des objets à deviner
        if (!game.guessObjects || game.guessObjects.length === 0) {
            throw new Error("Aucun objets à guess.");
        }

        // Vérifier si des joueurs sont présent dans le lobby
        if (game.players.length === 0) {
            throw new Error("Aucun joueur dans le lobby.");
        }

        // Sélection du premier objet à deviner
        const firstObject = game.guessObjects[0];

        // Création du premier round
        const firstRound = {
            status: 'GUESSING',
            guessObject: firstObject,
            playersGuesses: {},
        };

        game.status = 'IN_GAME';
        game.currentRound = firstRound;

        // Update game and send to the room
        updateGame(game)
        const updatedGame = getGame(gameID)
        socket.to(gameID).emit('updatedGame', updatedGame);

        return updatedGame;

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Impossible démarrer la partie ${playerID}: ${error.message}`);
        } else {
            throw new Error(`Erreur lors du démarrage de la partie ${gameID}: ${error}`);
        }
    }
}

export function handleGuess(socket: Socket, gameID: string, playerID: string, guess: any) {
    try {

        // Récupération du jeu dans la base de données
        const game = getGame(gameID)

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
        if (!game.currentRound) {
            throw new Error("Aucun round actif.");
        }

        if (!game.currentRound.playersGuesses[playerID]) {

            // Update game and send to the room
            try {
                // Mettre à jour le guess du joueur dans currentRound.playersGuesses
                game.currentRound.playersGuesses[playerID] = guess;

                // Vérifier si tout le monde à guess
                const connectedPlayers = game.players.filter((player: any) => player.connected);
                if (Object.keys(game.currentRound.playersGuesses).length === connectedPlayers.length) {
                    game.currentRound.status = 'SHOWING_RESULTS'
                }

                //update game
                updateGame(game);
            } catch {
                throw new Error(`Erreur lors de la modification dans la base de données`)
            }

            const updatedGame = getGame(gameID)
            socket.to(gameID).emit('updatedGame', updatedGame);

            return updatedGame;
        }

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Impossible d'enregistrer le guess de ${playerID} dans la partie ${gameID}: ${error.message}`);
        } else {
            throw new Error(`Erreur lors de l'enregistrement du guess de ${playerID} dans la partie ${gameID}: ${error}`);
        }
    }
}

export function handleNextRound(socket: Socket, gameID: string, playerID: string) {
    try {
        // Récupération du jeu dans la base de données
        const game = getGame(gameID)

        if (!game) {
            throw new Error("Partie introuvable.");
        }

        // Vérifier que le host
        if (game.hostID !== playerID) {
            throw new Error("Le joueur n'est pas le host de la partie.");
        }

        // Vérification que la partie a encore des rounds à jouer
        if (!game.guessObjects || game.guessObjects.length === 0) {
            throw new Error("Aucun objet à deviner disponible.");
        }

        // Trouver l'index du currentRound
        const currentIndex = game.currentRound
            ? game.guessObjects.findIndex((obj: any) => obj.name === game.currentRound?.guessObject.name)
            : -1;

        // Vérifier que l'objet est dans la liste
        if (currentIndex === -1) {
            throw new Error("L'objet à deviner ne fais pas partie de la liste de la partie");
        }

        // Register results
        game.players = game.players.map((player: any) => {

            const newResult = {
                guessObject: game.currentRound.guessObject,
                distance: player.connected ? game.currentRound.playersGuesses[player.id].distance : -1,
                points: player.connected ? game.currentRound.playersGuesses[player.id].points : 0
            }

            return {
                ...player,
                results: [
                    ...player.results,
                    newResult
                ].filter(result => result !== null) // Filtrer les valeurs nulles
            }
        });

        // Go to next guess object
        if (currentIndex + 1 >= game.guessObjects.length) {
            game.status = 'IN_RESULTS'
            game.currentRound = undefined
        } else {
            game.currentRound = {
                status: 'GUESSING',
                guessObject: game.guessObjects[currentIndex + 1],
                playersGuesses: {},
            }
        }

        // Update game and send to the room
        updateGame(game);

        const updatedGame = getGame(gameID)
        socket.to(gameID).emit('updatedGame', updatedGame);

        return updatedGame;

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Impossible passer au round suivant: ${error.message}`);
        } else {
            throw new Error(`Erreur lors du passage au round suivant dans la partie ${gameID}: ${error}`);
        }
    }
}

export function endGame(socket: Socket, gameID: string, playerID: string) {
    try {
        // Récupération du jeu dans la base de données
        const game = getGame(gameID)

        if (!game) {
            throw new Error("Partie introuvable.");
        }

        // Vérifier le host
        if (game.hostID !== playerID) {
            throw new Error("Le joueur n'est pas le host de la partie.");
        }

        removeGame(gameID);

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

export async function reconnect(socket: Socket, gameID: string, playerID: string) {
    try {
        // Récupération du jeu dans la base de données
        const game = getGame(gameID)

        if (!game) {
            throw new Error("Partie introuvable.");
        }

        if (!game.players.some(player => player.id === playerID)) {
            throw new Error("Joueur introuvable dans la partie")
        }

        game.players.map(
            player => player.id === playerID ?
                {
                    ...player,
                    connected: true
                }
                : player
        )

        await socket.join(gameID)

        // Update game and send to the room
        updateGame(game);
        const updatedGame = getGame(gameID)
        socket.to(gameID).emit('updatedGame', updatedGame);

        return updatedGame;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Impossible supprimer la partie ${gameID}: ${error.message}`);
        } else {
            throw new Error(`Erreur lors de la suppression de la partie ${gameID}: ${error}`);
        }
    }
}

export function disconnectPlayer(socket: Socket, playerID: string, gameID: string) {
    try {
        const game = getGame(gameID)

        if (!game) return;

        // Changer l'état du joueur
        game.players = game.players.map((p: any) =>
            p.id === playerID ? { ...p, connected: false } : p
        );

        // Changer le host
        if (playerID === game.hostID) {
            const connectedPlayers = game.players.filter((player: any) => player.connected);
            if (connectedPlayers.length > 0) {
                game.hostID = connectedPlayers[0].id;
            } else {
                game.hostID = '';
            }
        }

        // Update l'état de la game si nécessaire
        if (game.status === 'IN_GAME' && game.currentRound) {
            switch (game.currentRound) {
                case 'GUESSING':
                    // Vérifier si tout le monde à guess
                    const connectedPlayers = game.players.filter((player: any) => player.connected);
                    if (Object.keys(game.currentRound.playersGuesses).length === connectedPlayers.length) {
                        game.currentRound.status = 'SHOWING_RESULTS '
                    }
                    break;
                case 'RESULTS':
                    break;
            }
        }

        // Update Game and send it
        updateGame(game);
        const updatedGame = getGame(gameID);
        socket.to(gameID).emit('updatedGame', updatedGame);
    } catch (error) {
        throw new Error(`Erreur lors de la déconnexion de ${playerID} dans la partie ${gameID}: ${error}`);
    }
}
