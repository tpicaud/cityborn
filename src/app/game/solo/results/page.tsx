'use client';

import ResultsComponent from "@/components/ResultsComponent";
import { useGameResults } from "@/contexts/GameResultsContext";

const SoloGameResultsPage = () => {
    const { playerResults } = useGameResults();

    return (
        playerResults ? (
            <ResultsComponent playerResults={playerResults} />
        ) : (
            <div>
                <h1>Results not found</h1>
            </div>
        )
    );
};

export default SoloGameResultsPage;
