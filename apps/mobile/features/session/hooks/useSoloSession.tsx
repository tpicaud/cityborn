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
import { useError } from '@cityborn/contexts';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createSession, createSoloGame, endSoloGame } from '@/lib/api/session';
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

  ////////////////
  // useEffects //
  ////////////////

  // Create session
  useEffect(() => {
    const fetchSession = async () => {
      const result = await createSession({ mode: SessionMode.SOLO });
      if (!result.ok) return invokeError(result.error);
      result.data.hostID = localPlayerID;
      updateSession(result.data);
    };
    fetchSession();
  }, [invokeError, localPlayerID, updateSession]);

  useEffect(() => {
    if (!game) return;

    const prevSession = sessionRef.current;
    if (!prevSession) {
      throw new Error('Cannot update game because session is not initialized');
    }
    updateSession({ ...prevSession, currentGame: game });
  }, [game, updateSession]);

  // useEffect(() => {
  //   console.log(session);
  // }, [session]);

  // useEffect(() => {
  //   console.log(game);
  // }, [game]);

  ///////////////////////
  // Session functions //
  ///////////////////////

  const updateGameConfig = (newConfig: Partial<GameConfig>) => {
    const prevSession = sessionRef.current;
    if (!prevSession) {
      throw new Error(
        'Cannot update game config because session is not initialized',
      );
    }
    updateSession({
      ...prevSession,
      gameConfig: { ...prevSession.gameConfig, ...newConfig },
    });
  };

  ////////////////////
  // Game functions //
  ////////////////////

  const startGame = async () => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;
    const result = await createSoloGame(currentSession);
    if (!result.ok) return invokeError(result.error);
    const game = result.data;

    updateSession({ ...currentSession, status: SessionStatus.IN_GAME });

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

  const guess = (guess: Guess) => {
    setGame((prevGame) => {
      if (!prevGame?.state.currentRound || !localPlayerID) return prevGame;

      return {
        ...prevGame,
        state: {
          ...prevGame.state,
          currentRound: {
            ...prevGame.state.currentRound,
            status: RoundStatus.SHOWING_RESULTS,
            playersGuesses: {
              [localPlayerID]: guess,
            },
          },
        },
      };
    });
  };

  const nextRound = () => {
    if (!game) return;

    // Record result of the round
    setGame((prevGame) => {
      if (!prevGame?.state.currentRound) return prevGame;

      const { guessObjectId, playersGuesses } = prevGame.state.currentRound;

      if (!playersGuesses) return prevGame;

      // Utilisation d'un Record à la place d'une Map
      const updatedResults = { ...prevGame.state.results };

      for (const [playerID, guess] of Object.entries(playersGuesses)) {
        const newResult: Result = {
          guessObjectId,
          distance: guess.distance,
          points: guess.points,
        };

        // Accéder ou créer le playerResults pour chaque joueur
        if (!updatedResults[playerID]) {
          updatedResults[playerID] = { results: [] };
        }

        updatedResults[playerID].results.push(newResult);
      }

      return {
        ...prevGame,
        state: {
          ...prevGame.state,
          results: updatedResults, // Retourner les résultats mis à jour
        },
      };
    });

    // Go to next guessObject
    const nextObjectIndex = getNextObjectId();

    if (nextObjectIndex) {
      setGame((prevGame) => {
        if (!prevGame) return prevGame;

        return {
          ...prevGame,
          state: {
            ...prevGame.state,
            currentRound: {
              status: RoundStatus.GUESSING,
              guessObjectId: nextObjectIndex,
              playersGuesses: {},
            },
          },
        };
      });
    }
  };

  const getNextObjectId = (): string | null => {
    if (!game) return null;

    // get current index
    const currentIndex = game.state.guessObjectsIds.indexOf(
      game.state.currentRound?.guessObjectId ?? '',
    );

    // Vérifier que l'objet est dans la liste
    if (currentIndex === undefined) {
      throw new Error(
        "L'objet à deviner ne fais pas partie de la liste de la partie",
      );
    }

    if (currentIndex + 1 < game.state.guessObjectsIds.length) {
      return game.state.guessObjectsIds[currentIndex + 1];
    } else {
      setGame((prevGame) => {
        if (!prevGame) return prevGame;

        return {
          ...prevGame,
          status: GameStatus.IN_RESULTS,
        };
      });
      return null;
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
    router.replace('/');
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
