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
import { useCallback, useEffect, useRef, useState } from 'react';
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
  // Source of truth for reads within this hook: kept in sync with `session`
  // synchronously (not via a useEffect) so functions called back-to-back in
  // the same tick (e.g. updateGameConfig then startGame) always see the
  // latest value, regardless of React's render/effect scheduling.
  const sessionRef = useRef<Session | undefined>(undefined);

  const updateSession = useCallback((next: Session) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  useEffect(() => {
    const init = async () => {
      const result = await createSession({ mode: SessionMode.SOLO });
      if (!result.ok) return invokeError(result.error);
      const session: Session = result.data;
      session.hostID = localPlayerID;
      updateSession(session);
    };
    init();
  }, [localPlayerID, invokeError, updateSession]);

  useEffect(() => {
    if (!game) return;
    const prev = sessionRef.current;
    if (!prev) throw new Error('Cannot update game: session not initialized');
    updateSession({ ...prev, currentGame: game });
  }, [game, updateSession]);

  useEffect(() => {
    console.log(session);
  }, [session]);

  const updateGameConfig = (newConfig: Partial<GameConfig>) => {
    const prev = sessionRef.current;
    if (!prev)
      throw new Error('Cannot update game config: session not initialized');
    updateSession({
      ...prev,
      gameConfig: { ...prev.gameConfig, ...newConfig },
    });
  };

  const startGame = async () => {
    const current = sessionRef.current;
    if (!current) return;
    const result = await createSoloGame(current);
    if (!result.ok) return invokeError(result.error);
    const game: Game = result.data;
    updateSession({ ...current, status: SessionStatus.IN_GAME });
    setGame({
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
    });
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
    const current = sessionRef.current;
    if (!current?.currentGame) return;
    const result = await endSoloGame(current);
    if (!result.ok) invokeError(result.error);
    updateSession({ ...current, currentGame: undefined });
  };

  const playAgain = async () => {
    if (!sessionRef.current?.currentGame) return;
    const result = await endSoloGame(sessionRef.current);
    if (!result.ok) invokeError(result.error);
    await startGame();
  };

  const exitGame = async () => {
    if (!sessionRef.current?.currentGame) return;
    const result = await endSoloGame(sessionRef.current);
    if (!result.ok) invokeError(result.error);
    router.push('/');
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
