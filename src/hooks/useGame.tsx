import { useEffect, useState } from "react";
import GuessObject from "@/types/GuessObject";
import { PlayerResults, Result } from "@/types/Results";

const useGame = (guessObjectList: GuessObject[]) => {

    // Initialisation des états
    const [guessObjectIndex, setGuessObjectIndex] = useState(0);
    const [currentGuessObject, setCurrentGuessObject] = useState<GuessObject>(guessObjectList[guessObjectIndex]);
    const [playerResults, setPlayerResults] = useState<PlayerResults>({results: []});
    const [isFinished, setIsFinished] = useState(false);

    // Passer au prochain guessObject
    useEffect(() => {
        setCurrentGuessObject(guessObjectList[guessObjectIndex]);
    }, [guessObjectIndex, guessObjectList]);

    // Enregistrer un résultat pour un joueur
    const recordResult = (newResult: Result) => {
        setPlayerResults((prevResults) => ({
            ...prevResults,
            results: [...prevResults.results, newResult], // Ajoutez le nouveau résultat
        }));
    };

    // Passer au prochain guess
    const nextGuessObject = () => {
        if (guessObjectIndex < guessObjectList.length - 1) {
            setGuessObjectIndex((prevIndex) => prevIndex + 1);
        } else {
            setIsFinished(true);
        }
    };

    // Remettre à zéro les données du jeu
    const resetGame = () => {
        setIsFinished(false);
    };

    return {
        currentGuessObject,
        playerResults,
        isFinished,
        recordResult,
        nextGuessObject,
        resetGame,
    };
};

export default useGame;