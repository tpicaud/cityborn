'use client';

import type { Session } from '@cityborn/api';
import {
  createGameDisplay,
  type GameComponentProps,
} from '@cityborn/client/game';
import { ArrowForward } from '@mui/icons-material';
import { Backdrop } from '@mui/material';
import GuessComponent from '@/components/guess/GuessComponent';
import LoadingComponent from '@/components/others/LoadingComponent';
import LoadingButton from '../ui/buttons/LoadingButton';
import ResultsComponent from './ResultsComponent';

export const GameComponent = ({
  localPlayerID,
  isHost,
  session,
  game,
  handleGuess,
  handleNextRound,
  handleEndGame,
  handlePlayAgain,
  handleExitGame,
}: GameComponentProps & {
  session: Session;
}) => {
  const gameDisplay = createGameDisplay(game, localPlayerID);

  if (gameDisplay.state === 'loading') return <LoadingComponent />;
  if (gameDisplay.state === 'unavailable')
    return <p>La partie est déjà en cours</p>;
  const activePlayerID = gameDisplay.localPlayerID;

  return (
    <div>
      <GuessComponent
        localPlayerID={activePlayerID}
        session={session}
        game={game}
        handleGuess={handleGuess}
        handleNextRound={handleNextRound}
      />
      {gameDisplay.roundNumber !== undefined && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="flex flex-col gap-2">
            {gameDisplay.showNextRound && (
              <LoadingButton
                variant="contained"
                color="error"
                disabled={!isHost}
                onClick={async () => {
                  await handleNextRound();
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
            )}
            <div className="bg-gray-200 text-black text-center px-3 py-1 rounded-full shadow text-sm font-semibold">
              {gameDisplay.roundNumber}/{gameDisplay.roundCount}
            </div>
          </div>
        </div>
      )}

      {gameDisplay.showResults && (
        <div className="absolute h-full w-full">
          <div className="flex flex-row w-full h-full items-center justify-center">
            <Backdrop open={true}>
              <div className="w-[80%]">
                <ResultsComponent
                  game={game}
                  localPlayerID={activePlayerID}
                  isHost={isHost}
                  mode={session.mode}
                  handleEndGame={handleEndGame}
                  handlePlayAgain={handlePlayAgain}
                  handleExitGame={handleExitGame}
                />
              </div>
            </Backdrop>
          </div>
        </div>
      )}
    </div>
  );
};
