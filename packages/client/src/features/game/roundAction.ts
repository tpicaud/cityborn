import {
  type Coord,
  type Game,
  type Guess,
  type PlayerId,
  RoundStatus,
} from '@cityborn/api';
import { currentRoundIndex, roundGuessObjectIds } from '@cityborn/core';

export type RoundAction = {
  kind: 'guess' | 'nextRound';
  label: string;
  detail: string | undefined;
  isEnabled: boolean;
};

type GuessProgress = {
  hasLocalGuess: boolean;
  guessedPlayerCount: number;
  playerCount: number;
};

function createGuessProgress({
  game,
  localPlayerID,
}: {
  game: Game;
  localPlayerID: PlayerId;
}): GuessProgress {
  const playersGuesses: Record<PlayerId, Guess> =
    game.state.currentRound?.playersGuesses ?? {};

  return {
    hasLocalGuess: playersGuesses[localPlayerID] !== undefined,
    guessedPlayerCount: Object.keys(playersGuesses).length,
    playerCount: Object.keys(game.state.results).length,
  };
}

export function canPlaceGuess({
  game,
  localPlayerID,
}: {
  game: Game;
  localPlayerID: PlayerId;
}): boolean {
  return (
    game.state.currentRound?.status === RoundStatus.GUESSING &&
    !createGuessProgress({ game, localPlayerID }).hasLocalGuess
  );
}

export function createRoundAction({
  game,
  localPlayerID,
  isHost,
  preGuess,
}: {
  game: Game;
  localPlayerID: PlayerId;
  isHost: boolean;
  preGuess: Coord | undefined;
}): RoundAction | undefined {
  const roundStatus: RoundStatus | undefined = game.state.currentRound?.status;

  if (roundStatus === RoundStatus.GUESSING) {
    const { hasLocalGuess, guessedPlayerCount, playerCount }: GuessProgress =
      createGuessProgress({ game, localPlayerID });

    if (!hasLocalGuess && preGuess === undefined) return undefined;

    return {
      kind: 'guess',
      label: hasLocalGuess ? `${guessedPlayerCount}/${playerCount}` : 'Guess !',
      detail: undefined,
      isEnabled: !hasLocalGuess,
    };
  }

  if (roundStatus !== RoundStatus.SHOWING_RESULTS) return undefined;

  return {
    kind: 'nextRound',
    label: 'Suivant',
    detail: `${currentRoundIndex(game) + 1}/${roundGuessObjectIds(game).length}`,
    isEnabled: isHost,
  };
}
