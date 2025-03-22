import Game from "@/types/Game";
import IUseGame from "./IUseGame";
import Guess from "@/types/Guess";
import { RoundStatus } from "@/enums/RoundStatus";
import GuessObject from "@/types/GuessObject";
import { Result } from "@/types/Results";
import { GameStatus } from "@/enums/GameStatus";

export function useSoloGame(
    game: Game | null,
    localPlayerID: string | null,
    setGame: React.Dispatch<React.SetStateAction<Game | null>>
): IUseGame {


    const startGame = () => {
        if (!game) return;

        const firstObject = game.guessObjects[0];
        if (firstObject) {
            setGame((prevGame) => {
                if (!prevGame) {
                    throw new Error('Cannot start game because game is not initialized');
                }

                return {
                    ...prevGame,
                    status: GameStatus.IN_PROGRESS,
                    currentRound: {
                        status: RoundStatus.GUESSING,
                        guessObject: firstObject,
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
                        guessObject: game.currentRound!.guessObject,
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
        const nextObject = getNextObject();

        if (nextObject) {
            setGame((prevGame) => {
                if (!prevGame) return prevGame;

                return {
                    ...prevGame,
                    currentRound: {
                        status: RoundStatus.GUESSING,
                        guessObject: nextObject,
                        playersGuesses: {},
                    },
                }
            });
        }
    };

    const getNextObject = (): GuessObject | null => {
        if (!game) return null;

        // get current index
        const currentIndex = game.currentRound
            ? game.guessObjects.findIndex((obj) => obj.name === game.currentRound?.guessObject.name)
            : -1;

        // Vérifier que l'objet est dans la liste
        if (currentIndex === -1) {
            throw new Error("L'objet à deviner ne fais pas partie de la liste de la partie");
        }

        if (currentIndex + 1 < game.guessObjects.length) {
            const nextObject = game.guessObjects[currentIndex + 1];
            return nextObject;
        } else {
            setGame((prevGame) => {
                if (!prevGame) return prevGame;

                return {
                    ...prevGame,
                    status: GameStatus.RESULTS
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