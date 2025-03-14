import { Socket } from "socket.io";
import { addGame, getAllGames, getGame, updateGame } from "./gamesStore.ts";

export async function postGame(socket: Socket, game: any) {
    console.log('Posted game:', game.id)
    try {
        addGame(game)
    } catch (error) {
        console.error("Erreur lors de la création de la game:", error);
        socket.emit('error', 'Erreur lors de la création de la game');
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
        if (game.status != 'Lobby') {
            throw new Error("La partie est déjà lancée.");
        }

        // Créer un nouveau joueur
        const newPlayer: any = { id: playerID, results: [], connected: true };

        game.players.push(newPlayer)
        if (game.players.length === 0) {
            game.hostID = playerID
        }

        updateGame(game)
        const updatedGame = getGame(gameID);
        await socket.join(gameID)
        socket.emit('updatedGame', updatedGame)
        socket.to(gameID).emit('updatedGame', updatedGame);

    } catch (error) {
        if (error instanceof Error) {
            console.error("Erreur lors de l'ajout du joueur:", error);
            throw new Error(`Impossible de rejoindre la partie: ${error.message}`);
        } else {
            console.error("Erreur inconnue:", error);
            throw new Error("Une erreur inconnue s'est produite.");
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
        if (game.status !== 'Lobby') {
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
            status: 'Guessing',
            guessObject: firstObject,
            playersGuesses: {},
        };

        game.status = 'In_progress';
        game.currentRound = firstRound;

        //update game
        updateGame(game)
        const updatedGame = getGame(gameID)
        socket.emit('updatedGame', updatedGame)
        socket.to(gameID).emit('updatedGame', updatedGame);
    } catch (error) {
        if (error instanceof Error) {
            console.error("Erreur lors du démarrage de la partie:", error);
            throw new Error(`Impossible ddémarrer la partie: ${error.message}`);
        } else {
            console.error("Erreur inconnue:", error);
            throw new Error("Une erreur inconnue s'est produite.");
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

        // Mettre à jour le guess du joueur dans currentRound.playersGuesses
        game.currentRound.playerGuesses[playerID] = guess;

        // Vérifier si tout le monde à guess
        const connectedPlayers = game.players.filter((player: any) => player.connected);
        if (Object.keys(game.currentRound.playerGuesses).length === connectedPlayers.length) {
            game.currentRound.status = 'Showing_results'
        }

        //update game
        updateGame(game)
        const updatedGame = getGame(gameID)
        socket.emit('updatedGame', updatedGame)
        socket.to(gameID).emit('updatedGame', updatedGame);
    } catch (error) {
        if (error instanceof Error) {
            console.error("Erreur lors du démarrage de la partie:", error);
            throw new Error(`Impossible ddémarrer la partie: ${error.message}`);
        } else {
            console.error("Erreur inconnue:", error);
            throw new Error("Une erreur inconnue s'est produite.");
        }
    }
}

export function nextRound(socket: Socket, gameID: string, playerID: string) {
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

        if (currentIndex + 1 >= game.guessObjects.length) {
            game.status = 'Results'
            game.currentRound = undefined
        } else {
            game.currentRound = {
                status: 'Guessing',
                guessObject: game.guessObjects[currentIndex + 1],
                playersGuesses: {},
            }
        }

        // Register results
        game.players = game.players.map((player: any) => {

            const newResult = {
                guessObject: game.currentRound.guessObject,
                distance: game.currentRound.playersGuesses[player.id].distance,
                points: game.currentRound.playersGuesses[player.id].points
            }

            return {
                ...player,
                results: [
                    ...player.results,
                    newResult
                ].filter(result => result !== null) // Filtrer les valeurs nulles
            }
        });

        //update game
        updateGame(game)

        const updatedGame = getGame(gameID)
        socket.emit('updatedGame', updatedGame)
        socket.to(gameID).emit('updatedGame', updatedGame);
    } catch (error) {
        if (error instanceof Error) {
            console.error("Erreur lors du démarrage de la partie:", error);
            throw new Error(`Impossible ddémarrer la partie: ${error.message}`);
        } else {
            console.error("Erreur inconnue:", error);
            throw new Error("Une erreur inconnue s'est produite.");
        }
    }
}

// export function endGame(gameID) {
//     // Implémentation à ajouter
// }

export function disconnectPlayer(socket: Socket, playerID: string, gameID: string) {
    try {
        const game = getGame(gameID)

        if (!game) return;

        if (game.status === 'Lobby') {
            game.players = game.players.filter((p: any) => p.id !== playerID);
        } else {
            game.players = game.players.map((p: any) =>
                p.id === playerID ? { ...p, connected: false } : p
            );
        }

        updateGame(game);

        const updatedGame = getGame(gameID);

        socket.leave(gameID)
        socket.to(gameID).emit('updatedGame', updatedGame);
    } catch (error) {
        console.error("Erreur lors la déconnexion du joueur:", error);
    }
}
