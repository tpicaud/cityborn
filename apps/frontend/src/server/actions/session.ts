'use server';

import type { Game, Session, SessionMode } from '@cityborn/api';
import { throwOnError } from '@/lib/actionUtils';
import { getServerClient } from '@/lib/serverClient';

export async function createSession(mode: SessionMode): Promise<Session> {
  const client = await getServerClient();
  const result = await client.session.createSession({ body: { mode } });
  throwOnError(result);
  return result.body;
}

export async function fetchSession(sessionId: string): Promise<Session> {
  const client = await getServerClient();
  const result = await client.session.getSession({ params: { id: sessionId } });
  throwOnError(result);
  return result.body;
}

export async function createSoloGame(session: Session): Promise<Game> {
  const client = await getServerClient();
  const result = await client.session.createGame({ body: session });
  throwOnError(result);
  return result.body;
}

export async function endSoloGame(session: Session): Promise<void> {
  if (!session.currentGame) return;
  const lightSession: Session = {
    ...session,
    currentGame: {
      ...session.currentGame,
      state: {
        ...session.currentGame.state,
        guessObjects: undefined,
      },
    },
  };
  const client = await getServerClient();
  const result = await client.session.endSoloGame({ body: lightSession });
  throwOnError(result);
}
