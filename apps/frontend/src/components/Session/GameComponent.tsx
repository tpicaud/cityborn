'use client';

import GuessComponent from "@/components/guess/GuessComponent";
import { ArrowForward } from "@mui/icons-material";
import { Button } from "@mui/material";
import { RoundStatus } from "@cityborn/types";
import LoadingComponent from "@/components/others/LoadingComponent";
import { Game } from "@cityborn/types";
import { Guess } from "@cityborn/types";
import { GameStatus } from "@cityborn/types";
import ResultsComponent from "./ResultsComponent";

export const GameComponent = ({ localPlayerID, isHost, game, handleGuess, handleNextRound, handleEnd, handlePlayAgain }: {
    localPlayerID: string,
    isHost: boolean;
    game: Game,
    handleGuess: (guess: Guess) => void,
    handleNextRound: () => void,
    handleEnd: () => void,
    handlePlayAgain: () => void
}) => {

    const NextButton: React.FC = () => {
        if (!game.state.currentRound) return null;

        return (
            <Button
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
            </Button>
        );
    };

    if (!game.state.currentRound && game.status === GameStatus.IN_GAME) return <LoadingComponent />; // Gérer le cas où currentRound est undefined

    switch (game.status) {
        case GameStatus.IN_RESULTS:
            return <ResultsComponent game={game} localPlayerID={localPlayerID} handleEnd={handleEnd} handlePlayAgain={handlePlayAgain} />

        case GameStatus.IN_GAME:
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
                                    {game.state.guessObjects.length}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )
    }
};

