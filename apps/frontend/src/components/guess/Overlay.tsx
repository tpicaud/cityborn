'use client';

import {
  type FullGuessObject,
  type Game,
  type Guess,
  type PlayerId,
  RoundStatus,
} from '@cityborn/api';
import {
  canSubmitGuess,
  createRoundResult,
  currentGuessObject,
  formatDistanceInKm,
  type RoundGuessOutcome,
  type RoundResult,
} from '@cityborn/client/game';
import { Box } from '@mui/material';
import LoadingButton from '../ui/buttons/LoadingButton';
import GuessObjectComponent from './GuessObjectComponent';
import Timer from './Timer';

type OverlayProps = {
  localPlayerID: PlayerId;
  preGuess: Guess | undefined;
  game: Game;
  handleGuess: (value: Guess) => Promise<void>;
  handleIsTimeUp: () => void;
};

function GuessButton({
  preGuess,
  disabled,
  handleGuess,
}: {
  preGuess: Guess | undefined;
  disabled: boolean;
  handleGuess: (value: Guess) => Promise<void>;
}) {
  return (
    <LoadingButton
      variant="contained"
      onClick={async () => {
        if (preGuess) await handleGuess(preGuess);
      }}
      disabled={disabled}
      sx={{
        color: 'white',
        fontWeight: 'bold',
        borderRadius: 2,
        py: 1,
        px: 2,
        width: '50%',
        textAlign: 'center',
      }}
    >
      Guess
    </LoadingButton>
  );
}

function LocalGuessOutcome({ outcome }: { outcome: RoundGuessOutcome }) {
  if (outcome.kind === 'timedOut') {
    return (
      <p>
        <b>Tu n'as pas deviné à temps !</b>
      </p>
    );
  }
  if (outcome.kind === 'found') {
    return (
      <p>
        <b>Bien joué ! Tu as deviné !</b>
      </p>
    );
  }
  return (
    <p>
      Tu es à <b>{formatDistanceInKm(outcome.distanceInKm)}</b> km
    </p>
  );
}

function GuessResult({ roundResult }: { roundResult: RoundResult }) {
  return (
    <div className="flex flex-col m-2 gap-2 items-center justify-center w-full">
      <Box className="flex flex-col py-2 px-4 text-xl md:text-xl lg:text-2xl text-center bg-green-200 text-green-600 rounded shadow-sm">
        <p>
          <b>{roundResult.localPoints}</b> pts
        </p>
        {roundResult.otherPlayersPoints.length > 0 && (
          <>
            <hr className="my-1 border-green-600 w-[70%] self-center" />
            <div className="flex flex-wrap justify-center mt-2 gap-1 text-sm w-full">
              {roundResult.otherPlayersPoints.map(({ playerID, points }) => (
                <div
                  key={playerID}
                  className="px-1 text-green-700 text-xs md:text-base "
                >
                  <b>{playerID}</b>: {points}
                </div>
              ))}
            </div>
          </>
        )}
      </Box>
      <Box className="p-2 text-xs md:text-base lg:text-xl text-center bg-blue-200 text-blue-600 rounded shadow-sm w-full">
        <p>
          <b>{roundResult.guessObject.name}</b> est né à{' '}
          <b>{roundResult.guessObject.world_location.name}</b>
        </p>
        <LocalGuessOutcome outcome={roundResult.localOutcome} />
      </Box>
    </div>
  );
}

export default function Overlay({
  localPlayerID,
  preGuess,
  game,
  handleGuess,
  handleIsTimeUp,
}: OverlayProps) {
  const guessObject: FullGuessObject | undefined = currentGuessObject(game);
  const roundResult: RoundResult | undefined = createRoundResult(
    game,
    localPlayerID,
  );
  const isGuessing: boolean =
    game.state.currentRound?.status === RoundStatus.GUESSING;

  return (
    <div>
      {guessObject && <GuessObjectComponent guessObject={guessObject} />}
      <div className="absolute w-[27%] mx-6 my-14">
        {isGuessing && (
          <Timer
            totalTimeInSeconds={game.config.timer}
            endMessage="Terminé !"
            onTimeUp={handleIsTimeUp}
          />
        )}
      </div>
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 min-w-20 w-[80%]">
        {isGuessing && (
          <div className="relative w-full flex justify-center items-center">
            <GuessButton
              preGuess={preGuess}
              disabled={!canSubmitGuess(game, localPlayerID, preGuess)}
              handleGuess={handleGuess}
            />
          </div>
        )}

        {roundResult && <GuessResult roundResult={roundResult} />}
      </div>
    </div>
  );
}
