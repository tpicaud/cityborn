'use client';

import ResultsComponent from '@/components/ResultsComponent';
import GuessComponent from '@/components/guess/GuessComponent';
import { tennisList } from '@/data/stars';
import useGame from '@/hooks/useGame';
import GuessObject from '@/types/GuessObject';

export default function GamePage() {

    const guessObjectList: GuessObject[] = tennisList;

    const {
        currentGuessObject,
        isFinished,
        playerResults,
        nextGuessObject,
        recordResult,
        resetGame
    } = useGame(guessObjectList);

    return (
        <div>
            <GuessComponent guessObject={currentGuessObject} nextGuessObject={nextGuessObject} recordResult={recordResult} />
            {isFinished && (
                <ResultsComponent playerResults={playerResults} resetGame={resetGame} />
            )}
        </div>
    );
}
