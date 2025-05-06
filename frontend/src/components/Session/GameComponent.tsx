'use client';

import GuessComponent from "@/components/guess/GuessComponent";
import { ArrowForward } from "@mui/icons-material";
import { Button } from "@mui/material";
import { RoundStatus } from "@/enums/RoundStatus";
import LoadingComponent from "@/components/others/LoadingComponent";
import Game from "@/types/Game";
import Guess from "@/types/Guess";
import { Session } from "@/types/Session";
import { GameStatus } from "@/enums/GameStatus";
import ResultsComponent from "./ResultsComponent";

export const GameComponent = ({ localPlayerID, game, session, handleGuess, handleNextRound, endGame }: {
    localPlayerID: string,
    game: Game,
    session: Session,
    handleGuess: (guess: Guess) => void,
    handleNextRound: () => void,
    endGame: () => void,
}) => {

    const NextButton: React.FC = () => {
        if (!game?.currentRound) return null; // On s'assure que currentRound est défini

        return (
            <Button
                variant="contained"
                color="error"
                disabled={session.hostID !== localPlayerID}
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

    switch (game.status) {
        case GameStatus.IN_RESULTS:
            return <ResultsComponent game={game} localPlayerID={localPlayerID} endGame={endGame} />

        case GameStatus.IN_GAME:
            return (
                <div>
                    <GuessComponent
                        localPlayerID={localPlayerID}
                        game={game}
                        handleGuess={handleGuess}
                        handleNextRound={handleNextRound}
                    />
                    {game.currentRound && (
                        <div className='absolute right-2 top-1/2 transform -translate-y-1/2'>
                            <div className="flex flex-col gap-2">
                                {game.currentRound.status === RoundStatus.SHOWING_RESULTS && (
                                    <NextButton />
                                )}
                                <div className='bg-gray-200 text-black text-center px-3 py-1 rounded-full shadow text-sm font-semibold'>
                                    {game.guessObjectsIds.findIndex(id => (game.currentRound!.guessObjectId === id)) + 1}
                                    /
                                    {game.guessObjects.length}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )
    }
};

