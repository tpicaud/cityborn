'use server';

import type { CreateSession, Game, Session } from '@cityborn/api';
import {
  type AppResult,
  buildFinalizeGameBody,
  toAppResult,
} from '@cityborn/client';
import { getServerClient } from '@/lib/serverClient';

export async function createSession(
  data: CreateSession,
): Promise<AppResult<Session>> {
  const client = await getServerClient();
  const result = await client.session.createSession({ body: data });
  return toAppResult(result);
}

export async function fetchSession(
  sessionId: string,
): Promise<AppResult<Session>> {
  const client = await getServerClient();
  const result = await client.session.getSession({ params: { id: sessionId } });
  return toAppResult(result);
}

export async function createSoloGame(
  session: Session,
): Promise<AppResult<Game>> {
  const client = await getServerClient();
  const result = await client.session.createGame({ body: session });
  return toAppResult(result);
}

export async function finalizeGame(session: Session): Promise<AppResult<void>> {
  const body = buildFinalizeGameBody(session);
  if (!body) return { ok: true, data: undefined };
  const client = await getServerClient();
  const result = await client.session.finalizeGame({ body });
  const r = toAppResult(result);
  if (!r.ok) return r;
  return { ok: true, data: undefined };
}
