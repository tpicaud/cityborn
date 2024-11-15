'use client';

import GuessComponent from "@/components/guess/GuessComponent";
import GuessObject from "@/types/GuessObject";
import useGame from "@/hooks/useGame";
import { getLocalObjectList } from "@/services/LocalGameService";
import { useGameResults } from "@/contexts/GameResultsContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SoloGameComponent = () => {

    const router = useRouter();
    const [guessObjects, setGuessObjects] = useState<GuessObject[]>([]);
    const { setPlayerResults } = useGameResults();

    useEffect(() => {
        // Définir une fonction asynchrone à l'intérieur de useEffect
        const fetchData = async () => {
            try {
                const objects = await getLocalObjectList();
                setGuessObjects(objects); // Mettre à jour l'état avec les objets récupérés
            } catch (error) {
                console.error('Erreur lors de la récupération des objets:', error);
            }
        };

        // Appeler la fonction asynchrone
        fetchData();
    }, []);

    if (guessObjects.length === 0) {
        return <div>Loading...</div>;
    }

    const {
        currentGuessObject,
        playerResults,
        isFinished,
        recordResult,
        nextGuessObject,
    } = useGame(guessObjects);

    useEffect(() => {
        if (isFinished) {
            setPlayerResults(playerResults);

            // push to /result, relative to /game/solo
            router.push('solo/results');
        }
    }, [isFinished, playerResults, setPlayerResults, router]);

    return (
        <div>
            <GuessComponent guessObject={currentGuessObject} nextGuessObject={nextGuessObject} recordResult={recordResult} />
        </div>
    );
}

export default SoloGameComponent;