import Game from "@/types/Game";
import IUseGame from "./IUseGame";
import { useState } from "react";
import Guess from "@/types/Guess";
import { RoundStatus } from "@/enums/RoundStatus";
import GuessObject from "@/types/GuessObject";
import { Result } from "@/types/Results";

export function useSoloGame(game: Game, localPlayerID: string, setGame: ((game: Game) => void)): IUseGame {

    //const { game, localPlayerID, setGame } = useGameContext();
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleGuess = (guess: Guess) => {
        if (game && game.currentRound && localPlayerID ) { // Vérifie si game est null

            setGame({
                ...game,
                currentRound: {
                    ...game.currentRound,
                    playersGuesses: {
                        ...game.currentRound.playersGuesses,
                        [localPlayerID]: guess
                    }
                },
            });
        }
    };

    const handleNextRound = () => {
        if (game) {
            setGame({
                ...game,
                currentRound: {
                    status: RoundStatus.GUESSING,
                    playersGuesses: {},
                    guessObject: getNextObject()!,
                },
            });
        }
    };

    const recordResult = (result: Result) => {
        if (!game) return;

        setGame({
            ...game,
            players: game.players.map((player, index) =>
                index === 0
                    ? {
                        ...player,
                        results: [...player.results, result],
                    }
                    : player
            ),
        });
    };

    const getNextObject = (): GuessObject | null => {
        if (!game) return null; // Retourne null si game est null

        const nextObject = game.guessObjects[currentIndex];
        setCurrentIndex((prevIndex) => prevIndex + 1);
        return nextObject;
    };

    return {
        handleNextRound,
        recordResult,
        handleGuess
    }
}