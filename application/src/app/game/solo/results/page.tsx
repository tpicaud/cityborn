'use client';

import ResultsComponent from "@/components/ResultsComponent";
import { useGameResults } from "@/contexts/GameResultsContext";

const SoloGameResultsPage = () => {
    const { playerResults } = useGameResults();

    return (
        <div className="flex flex-col justify-center items-center min-h-screen">
            <div className="w-[90%]">
                {playerResults ? (
                    <ResultsComponent playerResults={playerResults} />
                ) : (
                    <div>
                        <h1>Results not found</h1>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SoloGameResultsPage;
