import {
  defaultGuess,
  type Game,
  GameStatus,
  type Guess,
  type PlayerId,
  PlayerIdSchema,
  type PlayerResults,
  type Result,
  RoundStatus,
} from '@cityborn/api';

export function beginGame(game: Game): Game {
  return {
    ...game,
    status: GameStatus.IN_GAME,
    state: {
      ...game.state,
      currentRound: {
        status: RoundStatus.GUESSING,
        guessObjectId: game.state.guessObjectsIds[0],
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

  for (const rawPlayerId of Object.keys(game.state.results)) {
    const playerId = PlayerIdSchema.parse(rawPlayerId);
    if (!playersGuesses[playerId]) playersGuesses[playerId] = defaultGuess;
  }

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

  for (const rawPlayerId of Object.keys(game.state.results)) {
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
  }

  return updatedResults;
}

export function resolveNextRound(game: Game): {
  game: Game;
  isGameOver: boolean;
} {
  const results = aggregateGameResults(game);
  const currentGuessObjectId = game.state.currentRound?.guessObjectId;
  const currentIndex = currentGuessObjectId
    ? game.state.guessObjectsIds.indexOf(currentGuessObjectId)
    : -1;

  if (currentIndex + 1 >= game.state.guessObjectsIds.length) {
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
          guessObjectId: game.state.guessObjectsIds[currentIndex + 1],
          playersGuesses: {},
        },
      },
    },
    isGameOver: false,
  };
}
