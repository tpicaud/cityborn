'use client';

import GuessComponent from "@/components/guess/GuessComponent";
import GuessObject from "@/types/GuessObject";
import useGame from "@/hooks/useGame";
import { getLocalObjectList } from "@/services/LocalGameService";
import { useGameResults } from "@/contexts/GameResultsContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const SoloGameComponent = () => {

    const router = useRouter();
    const guessObjectList: GuessObject[] = getLocalObjectList();

    const { setPlayerResults } = useGameResults();

    const {
        currentGuessObject,
        playerResults,
        isFinished,
        recordResult,
        nextGuessObject,
        resetGame,
    } = useGame(guessObjectList);

    useEffect(() => {
        if (isFinished) {
            setPlayerResults(playerResults);

            // push to /result, relative to /game/solo
            router.push('solo/results');
        }
    }, [isFinished]);

    return (
        <div>
            <GuessComponent guessObject={currentGuessObject} nextGuessObject={nextGuessObject} recordResult={recordResult} />
        </div>
    );
}

export default SoloGameComponent;