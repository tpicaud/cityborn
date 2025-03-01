import { useEffect, useState } from "react";
import Game from "@/types/Game";
import IUseGame from "./IUseGame";
import Guess from "@/types/Guess";
import { RoundStatus } from "@/enums/RoundStatus";
import GuessObject from "@/types/GuessObject";
import { Result } from "@/types/Results";
import { GameStatus } from "@/enums/GameStatus";

export function useMultiGame(
    game: Game,
    localPlayerID: string,
    setGame: React.Dispatch<React.SetStateAction<Game | null>>
): IUseGame {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Charger la game depuis le backend
    useEffect(() => {
        // TODO Websocket
    }, [game]);

    // Fonction pour envoyer une mise à jour au backend
    const updateGame = async (update: Partial<Game>) => {
        try {
            const response = await fetch("/api/game", {
                method: "PUT",
                body: JSON.stringify({
                    gameID: game?.id,
                    update
                }),
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                throw new Error("Erreur lors de la mise à jour de la game");
            }

            const data = await response.json();
            setGame(data); // Met à jour l'état local avec la réponse du backend
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la game:", error);
        }
    };

    // Enregistrer un guess
    const handleGuess = async (guess: Guess) => {
        if (!game || !game.currentRound) return;

        await fetch("/api/game/guess", {
            method: "PUT",
            body: JSON.stringify({
                gameID: game.id,
                playerID: localPlayerID,
                guess
            }),
            headers: { "Content-Type": "application/json" },
        });
    };

// Passer au round suivant (seulement l'hôte)
const handleNextRound = () => {
    if (!game || game.hostID !== localPlayerID) return;

    const nextObject = getNextObject();
    if (nextObject) {
        updateGame({
            currentRound: {
                status: RoundStatus.GUESSING,
                guessObject: nextObject,
                playersGuesses: {},
            },
        });
    } else {
        // Fin de la partie
        updateGame({ status: GameStatus.RESULTS });
    }
};

// Enregistrer un résultat pour un joueur
const recordResult = (result: Result) => {
    if (!game) return;

    updateGame({
        players: game.players.map((player) =>
            player.id === localPlayerID
                ? { ...player, results: [...player.results, result] }
                : player
        ),
    });
};

// Fonction pour obtenir le prochain objet à deviner
const getNextObject = (): GuessObject | null => {
    if (!game) return null;

    if (currentIndex < game.guessObjects.length) {
        const nextObject = game.guessObjects[currentIndex];
        setCurrentIndex((prevIndex) => prevIndex + 1);
        return nextObject;
    }

    return null;
};

return {
    handleNextRound,
    recordResult,
    handleGuess,
};
}
