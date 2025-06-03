import { GameStatus } from "@/enums/GameStatus";
import { RoundStatus } from "@/enums/RoundStatus";
import Game from "@/types/Game";
import Guess from "@/types/Guess";
import { useEffect, useState } from "react";
import GameConfig from "@/types/GameConfig";
import * as apiService from "@/services/apiService";
import { IUseGame } from "./IUseGame";
import { Result } from "@/types/Results";

export function useSoloGame(localPlayerID: string = 'guest'): IUseGame & {
    startGame: (gameConfig: GameConfig) => Promise<void>
} {

    const [game, setGame] = useState<Game>();

    useEffect(() => {
        console.log(game);
    }, [game])

    const startGame = async (gameConfig: GameConfig) => {
        try {
            // Create  new game
            const game = await apiService.createSoloGame(gameConfig, localPlayerID);

            // Start game
            setGame({
                ...game,
                status: GameStatus.IN_GAME,
                state: {
                    ...game.state,
                    currentRound: {
                        status: RoundStatus.GUESSING,
                        guessObjectId: game.state.guessObjectsIds[0],
                        playersGuesses: {},
                    }
                }
            })
        } catch (error) {
            throw new Error(`Error starting game: ${error}`);
        }
    };


    const guess = (guess: Guess) => {
        setGame((prevGame) => {
            if (!prevGame || !prevGame.state.currentRound || !localPlayerID) return prevGame;
            console.log('register guess')

            return {
                ...prevGame,
                state: {
                    ...prevGame.state,
                    currentRound: {
                        ...prevGame.state.currentRound,
                        status: RoundStatus.SHOWING_RESULTS,
                        playersGuesses: {
                            [localPlayerID]: guess,
                        },
                    },
                }
            };
        });
    };


    const nextRound = () => {
        if (!game) return;

        // Record result of the round
        setGame((prevGame) => {
            if (!prevGame || !prevGame.state.currentRound) return prevGame;

            const { guessObjectId, playersGuesses } = prevGame.state.currentRound;

            if (!playersGuesses) return prevGame;

            // Utilisation d'un Record à la place d'une Map
            const updatedResults = { ...prevGame.state.results };  // Copier l'objet pour ne pas muter l'état original

            for (const [playerID, guess] of Object.entries(playersGuesses)) {
                const newResult: Result = {
                    guessObjectId,
                    distance: guess.distance,
                    points: guess.points,
                };

                // Accéder ou créer le playerResults pour chaque joueur
                if (!updatedResults[playerID]) {
                    updatedResults[playerID] = { results: [] };  // Initialisation si non existant
                }

                updatedResults[playerID].results.push(newResult);  // Ajouter le nouveau résultat
            }

            return {
                ...prevGame,
                state: {
                    ...prevGame.state,
                    results: updatedResults,  // Retourner les résultats mis à jour
                }
            };
        });


        // Go to next guessObject
        const nextObjectIndex = getNextObjectId();

        if (nextObjectIndex) {
            setGame((prevGame) => {
                if (!prevGame) return prevGame;

                return {
                    ...prevGame,
                    state: {
                        ...prevGame.state,
                        currentRound: {
                            status: RoundStatus.GUESSING,
                            guessObjectId: nextObjectIndex,
                            playersGuesses: {},
                        }
                    }
                }
            });
        }
    };

    const getNextObjectId = (): string | null => {
        if (!game) return null;

        // get current index
        const currentIndex = game.state.guessObjectsIds.findIndex(id => game.state.currentRound?.guessObjectId === id);

        // Vérifier que l'objet est dans la liste
        if (currentIndex === undefined) {
            throw new Error("L'objet à deviner ne fais pas partie de la liste de la partie");
        }

        if (currentIndex + 1 < game.state.guessObjects.length) {
            return game.state.guessObjectsIds[currentIndex + 1];
        } else {
            setGame((prevGame) => {
                if (!prevGame) return prevGame;

                return {
                    ...prevGame,
                    status: GameStatus.IN_RESULTS
                };
            });
            return null;
        }
    };

    const end = () => {
        setGame(undefined);
    }

    return {
        game,
        isHost: true,
        startGame,
        guess,
        nextRound,
        end
    }
}