import Game from "@/types/Game";
import IUseGame from "./IUseGame";
import { useEffect, useState } from "react";
import Guess from "@/types/Guess";
import { RoundStatus } from "@/enums/RoundStatus";
import GuessObject from "@/types/GuessObject";
import { Result } from "@/types/Results";
import { GameStatus } from "@/enums/GameStatus";

export function useSoloGame(
    game: Game,
    localPlayerID: string,
    setGame: React.Dispatch<React.SetStateAction<Game | null>>
): IUseGame {

    const [currentIndex, setCurrentIndex] = useState(0);

    const startGame = () => {
        const firstObject = getNextObject();
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

    const joinGame = () => {
        setGame((prevGame) => {
            if (!prevGame) return prevGame;

            return {
                ...prevGame,
                players: [{
                    id: localPlayerID,
                    results: []
                }]
            }
        })
    }

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
        console.log(nextObject);

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

            console.log("next round handled");
        }
    };

    const getNextObject = (): GuessObject | null => {
        if (!game) return null;

        if (currentIndex < game.guessObjects.length) {
            const nextObject = game.guessObjects[currentIndex];
            setCurrentIndex((prevIndex) => prevIndex + 1);
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

    useEffect(() => {
        startGame();
    }, []);

    return {
        joinGame,
        handleNextRound,
        handleGuess,
        startGame
    }
}