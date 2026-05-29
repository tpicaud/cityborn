'use server';

import { buildEndSoloGameBody, type CreateSession, type Game, type Session } from '@cityborn/api';
import { type ActionResult, toActionResult } from '@cityborn/api';
import { getServerClient } from '@/lib/serverClient';

export async function createSession(
  data: CreateSession,
): Promise<ActionResult<Session>> {
  const client = await getServerClient();
  const result = await client.session.createSession({ body: data });
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
  const body = buildEndSoloGameBody(session);
  if (!body) return { ok: true, data: undefined };
  const client = await getServerClient();
  const result = await client.session.endSoloGame({ body });
  return toActionResult(result) as ActionResult<void>;
}
