'use client';

import GuessComponent from "@/components/guess/GuessComponent";
import GuessObject from "@/types/GuessObject";
import { getLocalObjectList } from "@/services/LocalGameService";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSoloGame } from "@/hooks/useSoloGame";
import { GameStatus } from "@/enums/GameStatus";

const SoloGameComponent = ({ category }: { category: string }) => {
    const router = useRouter();
    const [guessObjects, setGuessObjects] = useState<GuessObject[]>([]);

    const {
        game,
        handleGuess,
        handleNextRound,
        recordResult,
    } = useSoloGame(newGame);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const objects = await getLocalObjectList(category);
                setGuessObjects(objects);
            } catch (error) {
                console.error('Erreur lors de la récupération des objets:', error);
                fetchData();
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (game.status === GameStatus.FINISHED) {
            router.push('solo/results');
        }
    }, [game]);

    return (
        <div>
            <GuessComponent
                currentRound={game.currentRound}
                handleGuess={handleGuess}
                handleNextRound={handleNextRound}
                recordResult={recordResult}
            />
        </div>
    );
};

export default SoloGameComponent;
