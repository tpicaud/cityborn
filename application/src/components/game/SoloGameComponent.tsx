'use client';

import GuessComponent from "@/components/guess/GuessComponent";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSoloGame } from "@/hooks/useSoloGame";
import { GameStatus } from "@/enums/GameStatus";
import { ArrowForward } from "@mui/icons-material";
import { Button } from "@mui/material";
import { Result } from "@/types/Results";
import { RoundStatus } from "@/enums/RoundStatus";
import { useGameContext } from "@/contexts/GameContext";

export const SoloGameComponent = () => {
    const router = useRouter();


    const {
        game,
        localPlayerID,
        handleGuess,
        handleNextRound,
        recordResult,
    } = useSoloGame();

    useEffect(() => {
        // TODO put new game with gameConfig
    }, []);

    useEffect(() => {
        if (game.status === GameStatus.FINISHED) {
            router.push('solo/results');
        }
    }, [game]);

    const NextButton: React.FC = () => {
        const result: Result = {
            guessObject: game.currentRound.guessObject,
            distance: game.currentRound.playersGuesses![localPlayerID].distance,
            points: game.currentRound.playersGuesses![localPlayerID].points
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
