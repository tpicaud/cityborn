'use client';

import GuessComponent from "@/components/guess/GuessComponent";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { GameStatus } from "@/enums/GameStatus";
import { ArrowForward } from "@mui/icons-material";
import { Button } from "@mui/material";
import { Result } from "@/types/Results";
import { RoundStatus } from "@/enums/RoundStatus";
import LoadingComponent from "../LoadingComponent";
import { GameComponentProps } from "@/types/GameComponentProps";

export const SoloGameComponent = ({ props }: { props: GameComponentProps }) => {
    const router = useRouter();

    const {
        game,
        localPlayerID,
        handleGuess,
        handleNextRound,
        recordResult
    } = props

    useEffect(() => {
        if (game?.status === GameStatus.RESULTS) {
            router.push('solo/results');
        }
    }, [game]);

    const NextButton: React.FC = () => {
        if (!game?.currentRound) return null; // On s'assure que currentRound est défini

        const result: Result = {
            guessObject: game.currentRound.guessObject,
            distance: game.currentRound.playersGuesses![localPlayerID]?.distance,
            points: game.currentRound.playersGuesses![localPlayerID]?.points
        };

        return (
            <Button
                variant="contained"
                color="error"
                onClick={() => {
                    handleNextRound();
                    recordResult(result);
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

    if (!game?.currentRound) return <LoadingComponent />; // Gérer le cas où currentRound est undefined

    return (
        <div>
            <GuessComponent
                localPlayerID={localPlayerID}
                game={game}
                handleGuess={handleGuess}
                handleNextRound={handleNextRound}
                recordResult={recordResult}
            />
            <div>
                {game.currentRound.status === RoundStatus.SHOWING_RESULTS && (
                    <div className='absolute right-0'>
                        <NextButton />
                    </div>
                )}
            </div>
        </div>
    );
};

