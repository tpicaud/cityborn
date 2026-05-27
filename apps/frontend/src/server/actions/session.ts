'use server';

import type { Game, Session, SessionMode } from '@cityborn/api';
import { type ActionResult, toActionResult } from '@/lib/actionUtils';
import { getServerClient } from '@/lib/serverClient';

export async function createSession(
  mode: SessionMode,
): Promise<ActionResult<Session>> {
  const client = await getServerClient();
  const result = await client.session.createSession({ body: { mode } });
  return toActionResult(result);
}

export async function fetchSession(
  sessionId: string,
): Promise<ActionResult<Session>> {
  const client = await getServerClient();
  const result = await client.session.getSession({ params: { id: sessionId } });
  return toActionResult(result);
}

export async function createSoloGame(
  session: Session,
): Promise<ActionResult<Game>> {
  const client = await getServerClient();
  const result = await client.session.createGame({ body: session });
  return toActionResult(result);
}

export async function endSoloGame(
  session: Session,
): Promise<ActionResult<void>> {
  if (!session.currentGame) return { ok: true, data: undefined };
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
  return toActionResult(result) as ActionResult<void>;
}
