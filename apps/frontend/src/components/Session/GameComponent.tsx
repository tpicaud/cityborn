'use client';

import {
  type Game,
  GameStatus,
  RoundStatus,
  type Session,
} from '@cityborn/api';
import type { SessionController } from '@cityborn/client/session';
import { ArrowForward } from '@mui/icons-material';
import { Backdrop } from '@mui/material';
import GuessComponent from '@/components/guess/GuessComponent';
import LoadingComponent from '@/components/others/LoadingComponent';
import LoadingButton from '../ui/buttons/LoadingButton';
import ResultsComponent from './ResultsComponent';

export const GameComponent = ({
  localPlayerID,
  session,
  game,
  sessionController,
}: {
  localPlayerID: string | undefined;
  session: Session;
  game: Game;
  sessionController: SessionController;
}) => {
  const NextButton: React.FC = () => {
    if (!game.state.currentRound) return null;

    return (
      <LoadingButton
        variant="contained"
        color="error"
        disabled={!sessionController.isHost}
        onClick={sessionController.nextRound}
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

  if (
    (!game.state.currentRound && game.status === GameStatus.IN_GAME) ||
    game.status === GameStatus.STARTING
  )
    return <LoadingComponent />;
  if (!localPlayerID) return <p>La partie est déjà en cours</p>;
  return (
    <div>
      <GuessComponent
        localPlayerID={localPlayerID}
        session={session}
        game={game}
        handleGuess={sessionController.guess}
        handleNextRound={sessionController.nextRound}
      />
      {game.state.currentRound && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="flex flex-col gap-2">
            {game.state.currentRound.status === RoundStatus.SHOWING_RESULTS && (
              <NextButton />
            )}
            <div className="bg-gray-200 text-black text-center px-3 py-1 rounded-full shadow text-sm font-semibold">
              {game.state.guessObjectsIds.indexOf(
                game.state.currentRound?.guessObjectId,
              ) + 1}
              /{game.state.guessObjectsIds?.length}
            </div>
          </div>
        </div>
      )}

      {game.status === GameStatus.IN_RESULTS && (
        <div className="absolute h-full w-full">
          <div className="flex flex-row w-full h-full items-center justify-center">
            <Backdrop open={true}>
              <div className="w-[80%]">
                <ResultsComponent
                  game={game}
                  localPlayerID={localPlayerID}
                  mode={session.mode}
                  sessionController={sessionController}
                />
              </div>
            </Backdrop>
          </div>
        </div>
      )}
    </div>
  );
};
