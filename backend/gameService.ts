import { Socket } from "socket.io";
import { addGame, getGame, removeGame, updateGame } from "./redisGameStore.ts";
import { io } from "./server.ts";

export async function fetchGame(gameID: string) {
    try {
        const game = await getGame(gameID);
        if (!game) {
            throw new Error(`Partie ${gameID} introuvable`)
        }
        return game
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Impossible récupérer la partie ${gameID}: ${error.message}`);
        } else {
            throw new Error(`Erreur lors de la récupération de la partie ${gameID}: ${error}`);
        }
    }
}

export async function postGame(game: any) {
    try {
        if (await getGame(game.id)) {
            throw new Error(`La partie ${game.id} existe déjà.`);
        }
        await addGame(game);
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
        const game: any | undefined = await getGame(gameID)

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
        await updateGame(game)
        await socket.join(gameID)
        io.to(gameID).emit('game:update', game);

        return game;

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Impossible de rejoindre la partie: ${error.message}`);
        } else {
            throw new Error(`Erreur lors de la connexion de ${playerID} à la partie ${gameID}: ${error}`);
        }
    }
}

export async function startGame(gameID: string, playerID: string) {
    try {
        const game = await getGame(gameID)

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

        // Vérifier si des joueurs sont présent dans le lobby
        if (game.players.length === 0) {
            throw new Error("Aucun joueur dans le lobby.");
        }

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

        // Update game and send to the room
        await updateGame(game)
        io.to(gameID).emit('game:update', game);

        return game;

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Impossible démarrer la partie ${playerID}: ${error.message}`);
        } else {
            throw new Error(`Erreur lors du démarrage de la partie ${gameID}: ${error}`);
        }
    }
}

export async function handleGuess(gameID: string, playerID: string, guess: any) {
    try {

        // Récupération du jeu dans la base de données
        const start = Date.now()
        const game = await getGame(gameID);
        console.log('Latency retriving game:', Date.now() - start)

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
                const start2 = Date.now()
                await updateGame(game);
                console.log('Latency updating game:', Date.now() - start2)
            } catch {
                throw new Error(`Erreur lors de la modification dans la base de données`)
            }

            io.to(gameID).emit('game:update', game);

            return game;
        }

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Impossible d'enregistrer le guess de ${playerID} dans la partie ${gameID}: ${error.message}`);
        } else {
            throw new Error(`Erreur lors de l'enregistrement du guess de ${playerID} dans la partie ${gameID}: ${error}`);
        }
    }
}

export async function handleNextRound(gameID: string, playerID: string) {
    try {
        // Récupération du jeu dans la base de données
        const game = await getGame(gameID)

        if (!game) {
            throw new Error("Partie introuvable.");
        }

        // Vérifier que le host
        if (game.hostID !== playerID) {
            throw new Error("Le joueur n'est pas le host de la partie.");
        }

        // Vérification que la partie a encore des rounds à jouer
        if (!game.guessObjectsIds || game.guessObjectsIds.length === 0) {
            throw new Error("Aucun objet à deviner disponible.");
        }

        // Trouver l'index du currentRound
        const currentIndex = game.guessObjectsIds.findIndex((id: string) => id === game.currentRound.guessObjectId);

        // Vérifier que l'objet est dans la liste
        if (currentIndex === undefined) {
            throw new Error("L'objet à deviner ne fais pas partie de la liste de la partie");
        }

        // Register results
        game.players = game.players.map((player: any) => {

            const newResult = {
                guessObjectId: game.currentRound.guessObjectId,
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
        if (currentIndex + 1 >= game.guessObjectsIds.length) {
            game.status = 'IN_RESULTS'
            game.currentRound = undefined
        } else {
            game.currentRound = {
                status: 'GUESSING',
                guessObjectId: game.guessObjectsIds[currentIndex + 1],
                playersGuesses: {},
            }
        }

        // Update game and send to the room
        await updateGame(game);
        io.to(gameID).emit('game:update', game);

        return game;

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Impossible passer au round suivant: ${error.message}`);
        } else {
            throw new Error(`Erreur lors du passage au round suivant dans la partie ${gameID}: ${error}`);
        }
    }
}

export async function endGame(gameID: string, playerID: string) {
    try {
        // Récupération du jeu dans la base de données
        const game = await getGame(gameID)

        if (!game) {
            throw new Error("Partie introuvable.");
        }

        // Vérifier le host
        if (game.hostID !== playerID) {
            throw new Error("Le joueur n'est pas le host de la partie.");
        }

        await removeGame(gameID);

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
        const game = await getGame(gameID)

        if (!game) {
            throw new Error("Partie introuvable.");
        }

        if (!game.players.some(player => player.id === playerID)) {
            throw new Error("Joueur introuvable dans la partie")
        }

        if (game.hostID === '') {
            game.hostID = playerID
        } 
        game.players = game.players.map(
            player => player.id === playerID ?
                {
                    ...player,
                    connected: true
                }
                : player
        )

        await socket.join(gameID)

        // Update game and send to the room
        await updateGame(game);
        io.to(gameID).emit('game:update', game);

        return game;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Impossible supprimer la partie ${gameID}: ${error.message}`);
        } else {
            throw new Error(`Erreur lors de la suppression de la partie ${gameID}: ${error}`);
        }
    }
}

export async function disconnectPlayer(playerID: string, gameID: string) {
    try {
        const game = await getGame(gameID)

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
        await updateGame(game);
        io.to(gameID).emit('game:update', game);
    } catch (error) {
        throw new Error(`Erreur lors de la déconnexion de ${playerID} dans la partie ${gameID}: ${error}`);
    }
}
