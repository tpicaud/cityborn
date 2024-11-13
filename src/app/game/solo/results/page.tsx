'use client';

import ResultsComponent from "@/components/ResultsComponent";
import { useGameResults } from "@/contexts/GameResultsContext";

const SoloGameResultsPage = () => {
    const { playerResults, setPlayerResults } = useGameResults();

    const handleResetGame = () => {
        //setPlayerResults(undefined); // Réinitialiser les résultats
    };

    return (
        <ResultsComponent playerResults={playerResults!} resetGame={handleResetGame} />
    );
};

export default SoloGameResultsPage;
