'use client';

import LoadingComponent from "@/components/utils/LoadingComponent";
import ResultsComponent from "@/components/game/ResultsComponent";
import { useGameContext } from "@/contexts/GameContext";
import Game from "@/types/Game";
import { PlayerResults } from "@/types/Results";

const SoloGameResultsPage = () => {
    const { game, localPlayerID } = useGameContext();

    if (!game || !localPlayerID) {
        return <LoadingComponent />;
    }

    const playerResults = getGameResult(game, localPlayerID);

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

const getGameResult = (game: Game, localPlayerID: string): PlayerResults | null => {
    console.log(localPlayerID)
    console.log(game.players)
    const player = game.players.find((p) => p.id === localPlayerID);
    return player ? { results: player.results } : null;
};

export default SoloGameResultsPage;
