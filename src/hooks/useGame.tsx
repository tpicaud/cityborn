import { useEffect, useState } from "react";
import GuessObject from "@/types/GuessObject";
import { PlayerResults, Result } from "@/types/Results";

const useGame = (guessObjectList: GuessObject[]) => {

    // Fonction utilitaire pour vérifier si le tableau est vide
    const isEmpty = () => guessObjectList.length === 0;

    // Initialisation des états
    const [guessObjectIndex, setGuessObjectIndex] = useState(0);
    const [currentGuessObject, setCurrentGuessObject] = useState<GuessObject | null>(
        isEmpty() ? null : guessObjectList[0]
    );
    const [playerResults, setPlayerResults] = useState<PlayerResults>({ results: [] });
    const [isFinished, setIsFinished] = useState(false);

    // Mettre à jour le `currentGuessObject` lorsque l'index ou la liste changent
    useEffect(() => {
        if (!isEmpty() && guessObjectIndex < guessObjectList.length) {
            setCurrentGuessObject(guessObjectList[guessObjectIndex]);
        } else {
            setCurrentGuessObject(null); // Aucun objet si la liste est vide ou si l'index est hors limites
        }
    }, [guessObjectIndex, guessObjectList]);

    // Enregistrer un résultat pour un joueur
    const recordResult = (newResult: Result) => {
        setPlayerResults((prevResults) => ({
            ...prevResults,
            results: [...prevResults.results, newResult], // Ajouter le nouveau résultat
        }));
    };

    // Passer au prochain guessObject
    const nextGuessObject = () => {
        if (guessObjectIndex < guessObjectList.length - 1) {
            setGuessObjectIndex((prevIndex) => prevIndex + 1);
        } else {
            setIsFinished(true); // Terminer le jeu si on est à la fin de la liste
        }
    };

    // Remettre à zéro les données du jeu
    const resetGame = () => {
        setGuessObjectIndex(0);
        setPlayerResults({ results: [] });
        setIsFinished(isEmpty()); // Le jeu est terminé si la liste est vide
    };

    return {
        currentGuessObject,
        playerResults,
        isFinished,
        recordResult,
        nextGuessObject,
        resetGame,
        isEmpty, // Exposez la fonction isEmpty pour une utilisation extérieure
    };
};

export default useGame;
