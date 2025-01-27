'use client';

import GuessComponent from "@/components/guess/GuessComponent";
import GuessObject from "@/types/GuessObject";
import { getLocalObjectList } from "@/services/LocalGameService";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSoloGame } from "@/hooks/useSoloGame";
import { GameStatus } from "@/enums/GameStatus";
import { ArrowForward } from "@mui/icons-material";
import { Button } from "@mui/material";
import { Result } from "@/types/Results";
import { RoundStatus } from "@/enums/RoundStatus";

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

    const NextButton: React.FC = () => {
        const result: Result = {
            guessObject: game.currentRound.guessObject,
            distance: game.currentRound.playersGuesses![getLocalPlayerID()].distance,
            points: game.currentRound.playersGuesses![getLocalPlayerID()].points
        }
        return (
            <Button
                variant="contained"
                color="error"
                onClick={() => {
                    handleNextRound;
                    recordResult(result)
                }}
                sx={{
                    borderRadius: 6,
                    color: 'white',
                    fontWeight: 'bold',
                    minWidth: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <ArrowForward />
            </Button>
        );
    };

    return (
        <div>
            <GuessComponent
                currentRound={game.currentRound}
                handleGuess={handleGuess}
                handleNextRound={handleNextRound}
                recordResult={recordResult}
            />
            <div>
                {(game.currentRound.status === RoundStatus.SHOWING_RESULTS) && (
                    <div className='absolute right-0'>
                        <NextButton />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SoloGameComponent;
function getLocalPlayerID() {
    return 0
}

