import Game from "@/types/Game";
import IUseGame from "./IUseGame";
import Guess from "@/types/Guess";
import { RoundStatus } from "@/enums/RoundStatus";
import { Result } from "@/types/Results";
import { GameStatus } from "@/enums/GameStatus";

export function useSoloGame(
    game: Game | null,
    localPlayerID: string | null,
    setGame: React.Dispatch<React.SetStateAction<Game | null>>
): IUseGame {


    const startGame = () => {
        if (!game) return;

        const firstObjectIndex = 0;
        if (game.guessObjects[firstObjectIndex]) {
            setGame((prevGame) => {
                if (!prevGame) {
                    throw new Error('Cannot start game because game is not initialized');
                }

                return {
                    ...prevGame,
                    status: GameStatus.IN_GAME,
                    currentRound: {
                        status: RoundStatus.GUESSING,
                        guessObjectIndex: firstObjectIndex,
                        playersGuesses: {},
                    },
                };
            });
        } else {
            throw new Error('Cannot start game because no guess objects are available');
        }
    };

    const handleGuess = (guess: Guess) => {
        setGame((prevGame) => {
            if (!prevGame || !prevGame.currentRound || !localPlayerID) return prevGame;

            return {
                ...prevGame,
                currentRound: {
                    ...prevGame.currentRound,
                    status: RoundStatus.SHOWING_RESULTS,
                    playersGuesses: {
                        ...prevGame.currentRound.playersGuesses,
                        [localPlayerID]: guess,
                    },
                },
            };
        });
    };


    const handleNextRound = () => {
        if (!game) return;

        // Record result of the round
        setGame((prevGame) => {
            if (!prevGame) return prevGame;

            return {
                ...prevGame,
                players: game.players.map(player => {
                    const newResult: Result = {
                        guessObjectName: game.guessObjects[game.currentRound!.guessObjectIndex].name,
                        distance: game.currentRound!.playersGuesses![player.id].distance,
                        points: game.currentRound!.playersGuesses![player.id].points
                    }

                    return {
                        ...player,
                        results: [
                            ...player.results,
                            newResult
                        ].filter(result => result !== null) // Filtrer les valeurs nulles
                    }
                })
            }
        })

        // Go to next guessObject
        const nextObjectIndex = getNextObjectIndex();

        if (nextObjectIndex) {
            setGame((prevGame) => {
                if (!prevGame) return prevGame;

                return {
                    ...prevGame,
                    currentRound: {
                        status: RoundStatus.GUESSING,
                        guessObjectIndex: nextObjectIndex,
                        playersGuesses: {},
                    },
                }
            });
        }
    };

    const getNextObjectIndex = (): number | null => {
        if (!game) return null;

        // get current index
        const currentIndex = game.currentRound?.guessObjectIndex ;

        // Vérifier que l'objet est dans la liste
        if (currentIndex === undefined) {
            throw new Error("L'objet à deviner ne fais pas partie de la liste de la partie");
        }

        if (currentIndex + 1 < game.guessObjects.length) {
            return currentIndex + 1;
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

    return {
        startGame,
        handleNextRound,
        handleGuess
    }
}