import Game from "@/types/Game";
import IUseGame from "./IUseGame";
import { useState } from "react";
import Guess from "@/types/Guess";
import { RoundStatus } from "@/enums/RoundStatus";
import GuessObject from "@/types/GuessObject";
import { Result } from "@/types/Results";

export function useSoloGame(game: Game): IUseGame {
    const [currentGame, setCurrentGame] = useState<Game>(game);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleGuess = (guess: Guess) => {
        setCurrentGame((prevGame) => ({
            ...prevGame,
            currentRound: {
                ...prevGame.currentRound,
                localPlayerGuess: guess, // Met à jour le guess de l'utilisateur
            },
        }));
    };

    const handleNextRound = () => {
        setCurrentGame((prevGame) => ({
            ...prevGame,
            currentRound: {
                ...prevGame.currentRound,
                localPlayerGuess: undefined,
                status: RoundStatus.GUESSING,
                remotePlayersGuesses: [],
                guessObject: getNextObject(prevGame),
            },
        }));
    };

    const recordResult = (result: Result) => {
        setCurrentGame((prevGame) => ({
            ...prevGame,
            localPlayer: {
                ...prevGame.localPlayer,
                results: [...prevGame.localPlayer.results, result], // Ajoute le résultat à la liste
            },
        }));
    };

    const getNextObject = (prevGame: Game): GuessObject => {
        const nextObject = prevGame.guessObjects[currentIndex];
        setCurrentIndex((prevIndex) => prevIndex + 1);
        return nextObject;
    };

    return {
        game: currentGame,
        handleGuess,
        handleNextRound,
        recordResult,
    };
}