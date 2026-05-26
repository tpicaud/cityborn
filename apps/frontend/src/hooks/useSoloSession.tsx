import {
  type Game,
  type GameConfig,
  GameStatus,
  type Guess,
  type Result,
  RoundStatus,
  type Session,
  SessionMode,
  SessionStatus,
} from '@cityborn/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useError } from '@/contexts/ErrorContext';
import {
  createSession,
  createSoloGame,
  endSoloGame,
} from '@/server/actions/session';
import type { IUseSession } from './IUseSession';

export function useSoloSession(localPlayerID: string): IUseSession {
  const router = useRouter();
  const { invokeError } = useError();
  const [session, setSession] = useState<Session>();
  const [game, setGame] = useState<Game>();

  useEffect(() => {
    const init = async () => {
      try {
        const s = await createSession(SessionMode.SOLO);
        s.hostID = localPlayerID;
        setSession(s);
      } catch (error: unknown) {
        invokeError(error);
      }
    };
    init();
  }, [localPlayerID, invokeError]);

  useEffect(() => {
    if (!game) return;
    setSession((prev) => {
      if (!prev) throw new Error('Cannot update game: session not initialized');
      return { ...prev, currentGame: game };
    });
  }, [game]);

  useEffect(() => {
    console.log(session);
  }, [session]);

  const updateGameConfig = (newConfig: Partial<GameConfig>) => {
    setSession((prev) => {
      if (!prev)
        throw new Error('Cannot update game config: session not initialized');
      return { ...prev, gameConfig: { ...prev.gameConfig, ...newConfig } };
    });
  };

  const startGame = async () => {
    if (!session) return;
    try {
      const g = await createSoloGame(session);
      setSession((prev) =>
        prev ? { ...prev, status: SessionStatus.IN_GAME } : prev,
      );
      setGame({
        ...g,
        status: GameStatus.IN_GAME,
        state: {
          ...g.state,
          currentRound: {
            status: RoundStatus.GUESSING,
            guessObjectId: g.state.guessObjectsIds[0],
            playersGuesses: {},
          },
        },
      });
    } catch (error: unknown) {
      invokeError(error);
    }
  };

  const guess = (g: Guess) => {
    setGame((prev) => {
      if (!prev?.state.currentRound || !localPlayerID) return prev;
      return {
        ...prev,
        state: {
          ...prev.state,
          currentRound: {
            ...prev.state.currentRound,
            status: RoundStatus.SHOWING_RESULTS,
            playersGuesses: { [localPlayerID]: g },
          },
        },
      };
    });
  };

  const getNextObjectId = (): string | null => {
    if (!game) return null;
    const currentIndex = game.state.guessObjectsIds.indexOf(
      game.state.currentRound?.guessObjectId ?? '',
    );
    if (currentIndex + 1 < game.state.guessObjectsIds.length) {
      return game.state.guessObjectsIds[currentIndex + 1];
    }
    setGame((prev) =>
      prev ? { ...prev, status: GameStatus.IN_RESULTS } : prev,
    );
    return null;
  };

  const nextRound = () => {
    if (!game) return;

    setGame((prev) => {
      if (!prev?.state.currentRound) return prev;
      const { guessObjectId, playersGuesses } = prev.state.currentRound;
      if (!playersGuesses) return prev;

      const updatedResults = { ...prev.state.results };
      for (const [playerID, g] of Object.entries(playersGuesses)) {
        const newResult: Result = {
          guessObjectId,
          distance: g.distance,
          points: g.points,
        };
        if (!updatedResults[playerID])
          updatedResults[playerID] = { results: [] };
        updatedResults[playerID].results.push(newResult);
      }
      return { ...prev, state: { ...prev.state, results: updatedResults } };
    });

    const nextId = getNextObjectId();
    if (nextId) {
      setGame((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          state: {
            ...prev.state,
            currentRound: {
              status: RoundStatus.GUESSING,
              guessObjectId: nextId,
              playersGuesses: {},
            },
          },
        };
      });
    }
  };

  const endGame = async () => {
    if (!session?.currentGame) return;
    try {
      await endSoloGame(session);
    } catch (error: unknown) {
      invokeError(error);
    } finally {
      setSession((prev) => (prev ? { ...prev, currentGame: undefined } : prev));
    }
  };

  const playAgain = async () => {
    if (!session?.currentGame) return;
    try {
      await endSoloGame(session);
    } catch (error: unknown) {
      invokeError(error);
    } finally {
      await startGame();
    }
  };

  const exitGame = async () => {
    if (!session?.currentGame) return;
    try {
      await endSoloGame(session);
    } catch (error: unknown) {
      invokeError(error);
    } finally {
      router.push('/');
    }
  };

  return {
    session,
    isHost: true,
    updateGameConfig,
    startGame,
    guess,
    nextRound,
    endGame,
    playAgain,
    exitGame,
  };
}
