import {
  defaultGuess,
  type Game,
  GameStatus,
  type Guess,
  type PlayerResults,
  type Result,
  RoundStatus,
} from '@cityborn/api';

export function applyGuess(
  game: Game,
  playerID: string,
  guess: Guess,
  connectedPlayerUsernames: string[],
): Game {
  const currentRound = game.state.currentRound;
  if (!currentRound) return game;

  const existingGuesses = currentRound.playersGuesses ?? {};
  if (existingGuesses[playerID]) return game;

  const playersGuesses: Record<string, Guess> = {
    ...existingGuesses,
    [playerID]: guess,
  };

  const allConnectedPlayersGuessed = connectedPlayerUsernames.every(
    (username) => Object.hasOwn(playersGuesses, username),
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

  for (const username of Object.keys(game.state.results)) {
    if (!playersGuesses[username]) {
      playersGuesses[username] = defaultGuess;
    }
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
): Record<string, PlayerResults> {
  const currentRound = game.state.currentRound;
  const guessObjectId = currentRound?.guessObjectId ?? '';
  const playersGuesses = currentRound?.playersGuesses;

  const updatedResults: Record<string, PlayerResults> = {
    ...game.state.results,
  };

  for (const username of Object.keys(game.state.results)) {
    const guess = playersGuesses?.[username];
    const newResult: Result = {
      guessObjectId,
      distance: guess ? guess.distance : -1,
      points: guess ? guess.points : 0,
    };

    const playerResults = updatedResults[username];
    updatedResults[username] = playerResults
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
  const currentIndex = game.state.guessObjectsIds.indexOf(
    game.state.currentRound?.guessObjectId ?? '',
  );

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
