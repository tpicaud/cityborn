import { IUseSession } from './IUseSession';
import {
  Game,
  GameStatus,
  Guess,
  Result,
  RoundStatus,
  Session,
  SessionMode,
  SessionStatus,
} from '@cityborn/types';
import { GameConfig } from '@cityborn/types';
import { useEffect, useState } from 'react';
import { useError } from '@cityborn/contexts';
import { useRouter } from 'expo-router';
import { apiClient } from '@/lib/apiClient';

export function useSoloSession(localPlayerID: string): IUseSession {
  const router = useRouter();
  const { invokeError } = useError();
  const [session, setSession] = useState<Session>();
  const [game, setGame] = useState<Game>();

  ////////////////
  // useEffects //
  ////////////////

  // Create session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session: Session = await apiClient.createSession(
          SessionMode.SOLO,
        );
        session.hostID = localPlayerID;
        setSession(session);
      } catch (error: any) {
        invokeError(error);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    if (!game) return;

    setSession((prevSession) => {
      if (!prevSession) {
        throw new Error(
          'Cannot update game because session is not initialized',
        );
      }
      return {
        ...prevSession,
        currentGame: game,
      };
    });
  }, [game]);

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
    if (!session) return;

    setSession((prevSession) => {
      if (!prevSession) {
        throw new Error(
          'Cannot update game config because session is not initialized',
        );
      }
      return {
        ...prevSession,
        gameConfig: { ...prevSession.gameConfig, ...newConfig },
      };
    });
  };

  ////////////////////
  // Game functions //
  ////////////////////

  const startGame = async () => {
    if (!session) return;
    try {
      // Create  new game
      const game = await apiClient.createSoloGame(session);

      setSession((prevSession) => {
        if (!prevSession) return;
        return {
          ...prevSession,
          status: SessionStatus.IN_GAME,
        };
      });

      // Start game
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
    } catch (error: any) {
      invokeError(error);
    }
  };

  const guess = (guess: Guess) => {
    setGame((prevGame) => {
      if (!prevGame || !prevGame.state.currentRound || !localPlayerID)
        return prevGame;

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
      if (!prevGame || !prevGame.state.currentRound) return prevGame;

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
    const currentIndex = game.state.guessObjectsIds.findIndex(
      (id) => game.state.currentRound?.guessObjectId === id,
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
    if (!session || !session.currentGame) return;

    try {
      await apiClient.endSoloGame(session);
    } catch (error: any) {
      invokeError(error);
    } finally {
      setSession({
        ...session,
        currentGame: undefined,
      });
    }
  };

  const playAgain = async () => {
    if (!session || !session.currentGame) return;

    try {
      await apiClient.endSoloGame(session);
    } catch (error: any) {
      invokeError(error);
    } finally {
      await startGame();
    }
  };

  const exitGame = async () => {
    if (!session || !session.currentGame) return;

    try {
      await apiClient.endSoloGame(session);
    } catch (error: any) {
      invokeError(error);
    } finally {
      router.replace('/');
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
