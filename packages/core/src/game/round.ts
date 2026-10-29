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

  const playersGuesses: Record<PlayerId, Guess> = {
    ...existingGuesses,
    [playerID]: guess,
  };

  const allConnectedPlayersGuessed = connectedPlayerIds.every((playerId) =>
    Object.hasOwn(playersGuesses, playerId),
  );

  if (!allConnectedPlayersGuessed) {
    return {
      ...game,
      state: {
        ...game.state,
        currentRound: { ...currentRound, playersGuesses },
      },
    };
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
        ...currentRound,
        playersGuesses,
        status: RoundStatus.SHOWING_RESULTS,
      },
    },
  };
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
