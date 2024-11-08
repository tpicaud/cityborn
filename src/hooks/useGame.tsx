import { use, useEffect, useState } from "react";
import GuessObject from "@/types/GuessObject";
import { PlayerResults, Result } from "@/types/Results";

const useGame = (guessObjectList: GuessObject[]) => {

    // Initialisation des états
    const [guessObjects, setGuessObjectList] = useState<GuessObject[]>(guessObjectList);
    const [guessObjectIndex, setGuessObjectIndex] = useState(0);
    const [currentGuessObject, setCurrentGuessObject] = useState<GuessObject>(guessObjects[guessObjectIndex]);
    const [playerResults, setPlayerResults] = useState<PlayerResults>({results: []});
    const [isFinished, setIsFinished] = useState(false);

    // Passer au prochain guessObject
    useEffect(() => {
        setCurrentGuessObject(guessObjects[guessObjectIndex]);
    }, [guessObjectIndex]);


    // Enregistrer un résultat pour un joueur
    const recordResult = (newResult: Result) => {
        setPlayerResults((prevResults) => ({
            ...prevResults,
            results: [...prevResults.results, newResult], // Ajoutez le nouveau résultat
        }));
    };

    // Calculer le score du joueur
    const calculateScores = () => {
        const totalScore = playerResults.results.reduce(
            (acc, result) => acc + result.points,
            0
        );
        return totalScore;
    };


    // Passer au prochain guess
    const nextGuessObject = () => {
        if (guessObjectIndex < guessObjects.length - 1) {
            setGuessObjectIndex((prevIndex) => prevIndex + 1);
        } else {
            setIsFinished(true);
        }
    };

    // Remettre à zéro les données du jeu
    const resetGame = () => {
        setGuessObjectList([]);
        setPlayerResults({ results: [] });
        setIsFinished(false);
    };

    return {
        guessObjects,
        currentGuessObject,
        playerResults,
        isFinished,
        recordResult,
        nextGuessObject,
        calculateScores,
        resetGame,
    };
};

export default useGame;