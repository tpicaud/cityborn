'use client';

import GuessComponent from "@/components/guess/GuessComponent";
import { ArrowForward } from "@mui/icons-material";
import { Backdrop } from "@mui/material";
import { RoundStatus } from "@cityborn/types";
import LoadingComponent from "@/components/others/LoadingComponent";
import { Game } from "@cityborn/types";
import { Guess } from "@cityborn/types";
import { GameStatus } from "@cityborn/types";
import ResultsComponent from "./ResultsComponent";
import LoadingButton from "../ui/buttons/LoadingButton";

export const GameComponent = ({ localPlayerID, isHost, game, handleGuess, handleNextRound, handleEndGame, handlePlayAgain }: {
    localPlayerID: string | undefined,
    isHost: boolean;
    game: Game,
    handleGuess: (guess: Guess) => void,
    handleNextRound: () => void,
    handleEndGame: () => Promise<void>,
    handlePlayAgain: () => Promise<void>
}) => {

    const NextButton: React.FC = () => {
        if (!game.state.currentRound) return null;

        return (
            <LoadingButton
                variant="contained"
                color="error"
                disabled={!isHost}
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
            </LoadingButton>
        );
    };

    if ((!game.state.currentRound && game.status === GameStatus.IN_GAME) || game.status === GameStatus.STARTING) return <LoadingComponent />; // Gérer le cas où currentRound est undefined
    if (!localPlayerID) return <p>La partie est déjà en cours</p>
    return (
        <div>
            <GuessComponent
                localPlayerID={localPlayerID}
                game={game}
                handleGuess={handleGuess}
                handleNextRound={handleNextRound}
            />
            {game.state.currentRound && (
                <div className='absolute right-2 top-1/2 transform -translate-y-1/2'>
                    <div className="flex flex-col gap-2">
                        {game.state.currentRound.status === RoundStatus.SHOWING_RESULTS && (
                            <NextButton />
                        )}
                        <div className='bg-gray-200 text-black text-center px-3 py-1 rounded-full shadow text-sm font-semibold'>
                            {game.state.guessObjectsIds.findIndex(id => (game.state.currentRound!.guessObjectId === id)) + 1}
                            /
                            {game.state.guessObjectsIds!.length}
                        </div>
                    </div>
                </div>
            )}

            {game.status === GameStatus.IN_RESULTS && (
                <div className="absolute h-full w-full">
                    <div className="flex flex-row w-full h-full items-center justify-center">
                        <Backdrop open={true}>
                            <div className="w-[80%]">
                                <ResultsComponent game={game} localPlayerID={localPlayerID} handleEndGame={handleEndGame} handlePlayAgain={handlePlayAgain} />
                            </div>
                        </Backdrop>
                    </div>
                </div>
            )}
        </div>
    )
};

