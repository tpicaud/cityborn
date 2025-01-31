import Game from "@/types/Game";
import IUseGame from "./IUseGame";
import { useState } from "react";
import Guess from "@/types/Guess";
import { RoundStatus } from "@/enums/RoundStatus";
import GuessObject from "@/types/GuessObject";
import { Result } from "@/types/Results";
import { useGameContext } from "@/contexts/GameContext";

export function useSoloGame(): IUseGame {

    const { game, localPlayerID, setGame } = useGameContext();
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleGuess = (guess: Guess) => {
        setGame({
            ...game,
            currentRound: {
                ...game.currentRound,
                playersGuesses: {
                    ...game.currentRound.playersGuesses,
                    [localPlayerID]: guess   // Met à jour le guess de l'utilisateur
                }
            },
        });
    };

    const handleNextRound = () => {
        setGame({
            ...game,
            currentRound: {
                status: RoundStatus.GUESSING,
                playersGuesses: {},
                guessObject: getNextObject(),
            },
        });
    };

    const recordResult = (result: Result) => {
        setGame({
            ...game,
            players: game.players.map((player, index) =>
                index === 0 // Remplacez 0 par l'index souhaité ou une condition pour identifier le joueur
                    ? {
                        ...player,
                        results: [...player.results, result], // Ajoute le résultat au tableau existant
                    }
                    : player // Les autres joueurs restent inchangés
            ),
        });
    };


    const getNextObject = (): GuessObject => {
        const nextObject = game.guessObjects[currentIndex];
        setCurrentIndex((prevIndex) => prevIndex + 1);
        return nextObject;
    };

    return {
        game: game,
        localPlayerID,
        handleGuess,
        handleNextRound,
        recordResult,
    };
}