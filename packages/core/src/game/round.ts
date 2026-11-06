import {
  defaultGuess,
  type FullGuessObject,
  type Game,
  GameStatus,
  type Guess,
  type GuessObjectId,
  type PlayerId,
  PlayerIdSchema,
  type PlayerResults,
  type Result,
  type Round,
  RoundStatus,
} from '@cityborn/api';
import { calculateTotalPoints } from './utils';

export const roundCountdownInSeconds: number = 3;

export function roundGuessObjectIds(game: Game): GuessObjectId[] {
  return (
    game.state.roundGuessObjects?.map(({ id }) => id) ??
    game.state.guessObjectsIds
  );
}

export function beginGame(game: Game): Game {
  return {
    ...game,
    status: GameStatus.IN_GAME,
    state: {
      ...game.state,
      currentRound: {
        status: RoundStatus.GUESSING,
        guessObjectId: roundGuessObjectIds(game)[0],
        playersGuesses: {},
      },
    },
  };
}

function closeRoundOnceAllGuessed({
  game,
  round,
  connectedPlayerIDs,
}: {
  game: Game;
  round: Round;
  connectedPlayerIDs: PlayerId[];
}): Game {
  const playersGuesses: Record<PlayerId, Guess> = {
    ...(round.playersGuesses ?? {}),
  };
  const allConnectedPlayersGuessed: boolean = connectedPlayerIDs.every(
    (playerId) => Object.hasOwn(playersGuesses, playerId),
  );

  if (!allConnectedPlayersGuessed) {
    return { ...game, state: { ...game.state, currentRound: round } };
  }

  Object.keys(game.state.results).forEach((rawPlayerId: string) => {
    const playerId = PlayerIdSchema.parse(rawPlayerId);
    if (!playersGuesses[playerId]) playersGuesses[playerId] = defaultGuess;
  });

  return {
    ...game,
    state: {
      ...game.state,
      currentRound: {
        ...round,
        playersGuesses,
        status: RoundStatus.SHOWING_RESULTS,
      },
    },
  };
}

function withoutPlayer<Value>({
  record,
  playerID,
}: {
  record: Record<PlayerId, Value>;
  playerID: PlayerId;
}): Record<PlayerId, Value> {
  return Object.keys(record)
    .map((rawPlayerId: string) => PlayerIdSchema.parse(rawPlayerId))
    .filter((playerId: PlayerId) => playerId !== playerID)
    .reduce<Record<PlayerId, Value>>((remainingRecord, playerId) => {
      remainingRecord[playerId] = record[playerId];
      return remainingRecord;
    }, {});
}

export function applyGuess(
  game: Game,
  playerID: PlayerId,
  guess: Guess,
  connectedPlayerIds: PlayerId[],
): Game {
  const currentRound = game.state.currentRound;
  if (!currentRound) return game;

  const existingGuesses = currentRound.playersGuesses ?? {};
  if (existingGuesses[playerID]) return game;

  return closeRoundOnceAllGuessed({
    game,
    round: {
      ...currentRound,
      playersGuesses: { ...existingGuesses, [playerID]: guess },
    },
    connectedPlayerIDs: connectedPlayerIds,
  });
}

export function removePlayer({
  game,
  playerID,
  connectedPlayerIDs,
}: {
  game: Game;
  playerID: PlayerId;
  connectedPlayerIDs: PlayerId[];
}): Game {
  const remainingGame: Game = {
    ...game,
    state: {
      ...game.state,
      results: withoutPlayer({ record: game.state.results, playerID }),
    },
  };
  const currentRound: Round | undefined = game.state.currentRound;
  if (!currentRound) return remainingGame;

  const round: Round = currentRound.playersGuesses
    ? {
        ...currentRound,
        playersGuesses: withoutPlayer({
          record: currentRound.playersGuesses,
          playerID,
        }),
      }
    : currentRound;
  const hasRemainingPlayer: boolean =
    Object.keys(remainingGame.state.results).length > 0;
  if (currentRound.status !== RoundStatus.GUESSING || !hasRemainingPlayer)
    return {
      ...remainingGame,
      state: { ...remainingGame.state, currentRound: round },
    };

  return closeRoundOnceAllGuessed({
    game: remainingGame,
    round,
    connectedPlayerIDs,
  });
}

export function playerScore({
  game,
  playerID,
}: {
  game: Game;
  playerID: PlayerId;
}): number {
  const currentRound: Round | undefined = game.state.currentRound;
  const revealedRoundPoints: number =
    currentRound?.status === RoundStatus.SHOWING_RESULTS
      ? (currentRound.playersGuesses?.[playerID]?.points ?? 0)
      : 0;
  const completedRoundsPoints: number = calculateTotalPoints(
    game.state.results[playerID] ?? { results: [] },
  );
  return completedRoundsPoints + revealedRoundPoints;
}

export function aggregateGameResults(
  game: Game,
): Record<PlayerId, PlayerResults> {
  const currentRound = game.state.currentRound;
  if (!currentRound) return game.state.results;

  const { guessObjectId, playersGuesses } = currentRound;
  const updatedResults: Record<PlayerId, PlayerResults> = {
    ...game.state.results,
  };

  Object.keys(game.state.results).forEach((rawPlayerId: string) => {
    const playerId = PlayerIdSchema.parse(rawPlayerId);
    const guess = playersGuesses?.[playerId];
    const newResult: Result = {
      guessObjectId,
      distance: guess ? guess.distance : -1,
      points: guess ? guess.points : 0,
    };

    const playerResults = updatedResults[playerId];
    updatedResults[playerId] = playerResults
      ? { results: [...playerResults.results, newResult] }
      : { results: [newResult] };
  });

  return updatedResults;
}

export function resolveNextRound(game: Game): {
  game: Game;
  isGameOver: boolean;
} {
  const results = aggregateGameResults(game);
  const guessObjectIds: GuessObjectId[] = roundGuessObjectIds(game);
  const currentGuessObjectId = game.state.currentRound?.guessObjectId;
  const currentIndex = currentGuessObjectId
    ? guessObjectIds.indexOf(currentGuessObjectId)
    : -1;

  if (currentIndex + 1 >= guessObjectIds.length) {
    return {
      game: {
        ...game,
        status: GameStatus.IN_RESULTS,
        state: { ...game.state, results },
      },
      isGameOver: true,
    };
  }

  return {
    game: {
      ...game,
      state: {
        ...game.state,
        results,
        currentRound: {
          status: RoundStatus.GUESSING,
          guessObjectId: guessObjectIds[currentIndex + 1],
          playersGuesses: {},
        },
        roundGuessObjects: game.state.roundGuessObjects?.map(
          ({ world_location, source, ...roundGuessObject }) => roundGuessObject,
        ),
      },
    },
    isGameOver: false,
  };
}

export function hideGuessingRoundGuesses(game: Game): Game {
  const currentRound: Round | undefined = game.state.currentRound;
  if (
    currentRound?.status !== RoundStatus.GUESSING ||
    !currentRound.playersGuesses
  )
    return game;

  const playersGuesses: Record<PlayerId, Guess> = Object.keys(
    currentRound.playersGuesses,
  ).reduce<Record<PlayerId, Guess>>((hiddenGuesses, rawPlayerId) => {
    hiddenGuesses[PlayerIdSchema.parse(rawPlayerId)] = defaultGuess;
    return hiddenGuesses;
  }, {});

  return {
    ...game,
    state: {
      ...game.state,
      currentRound: { ...currentRound, playersGuesses },
    },
  };
}

export function revealGuessObject({
  game,
  guessObject,
}: {
  game: Game;
  guessObject: FullGuessObject;
}): Game {
  return {
    ...game,
    state: {
      ...game.state,
      roundGuessObjects: game.state.roundGuessObjects?.map(
        (roundGuessObject) =>
          roundGuessObject.id === guessObject.id
            ? guessObject
            : roundGuessObject,
      ),
    },
  };
}
