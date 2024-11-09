import GuessComponent from "@/components/guess/GuessComponent";
import ResultsComponent from "@/components/ResultsComponent";
import GuessObject from "@/types/GuessObject";
import useGame from "@/hooks/useGame";
import { getLocalObjectList } from "@/services/LocalGameService";

const SoloGameComponent = () => {

    const guessObjectList: GuessObject[] = getLocalObjectList();

    const {
        currentGuessObject,
        playerResults,
        isFinished,
        recordResult,
        nextGuessObject,
        resetGame,
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

export default SoloGameComponent;