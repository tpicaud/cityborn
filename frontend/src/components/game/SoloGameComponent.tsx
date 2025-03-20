'use client';

import GuessComponent from "@/components/guess/GuessComponent";
import { ArrowForward } from "@mui/icons-material";
import { Button } from "@mui/material";
import { RoundStatus } from "@/enums/RoundStatus";
import LoadingComponent from "@/components/others/LoadingComponent";
import { GameComponentProps } from "@/types/GameComponentProps";

export const SoloGameComponent = ({ props }: { props: GameComponentProps }) => {

    const {
        game,
        localPlayerID,
        handleGuess,
        handleNextRound,
    } = props



    const NextButton: React.FC = () => {
        if (!game?.currentRound) return null; // On s'assure que currentRound est défini

        return (
            <Button
                variant="contained"
                color="error"
                onClick={() => {
                    handleNextRound();
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
            />
            <div>
                {game.currentRound.status === RoundStatus.SHOWING_RESULTS && (
                    <div className='absolute right-2 top-1/2 transform -translate-y-1/2'>
                        <NextButton />
                    </div>
                )}
            </div>
        </div>
    );
};

