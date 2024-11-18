'use client';

import GuessComponent from "@/components/guess/GuessComponent";
import GuessObject from "@/types/GuessObject";
import useGame from "@/hooks/useGame";
import { getLocalObjectList } from "@/services/LocalGameService";
import { useGameResults } from "@/contexts/GameResultsContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingComponent from "../LoadingComponent";

const SoloGameComponent = () => {
    const router = useRouter();
    const [guessObjects, setGuessObjects] = useState<GuessObject[]>([]);
    const { setPlayerResults } = useGameResults();

    const {
        currentGuessObject,
        playerResults,
        isFinished,
        recordResult,
        nextGuessObject,
    } = useGame(guessObjects);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const objects = await getLocalObjectList();
                setGuessObjects(objects);
            } catch (error) {
                console.error('Erreur lors de la récupération des objets:', error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (isFinished) {
            setPlayerResults(playerResults);
            router.push('solo/results');
        }
    }, [isFinished, playerResults, setPlayerResults, router]);

    if (!currentGuessObject) {
        return <LoadingComponent />;
    }

    return (
        <div>
            <GuessComponent
                guessObject={currentGuessObject}
                nextGuessObject={nextGuessObject}
                recordResult={recordResult}
            />
        </div>
    );
};

export default SoloGameComponent;
