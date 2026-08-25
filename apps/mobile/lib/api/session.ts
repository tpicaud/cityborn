import type { CreateSession, Game, Session } from '@cityborn/api';
import {
  type AppResult,
  buildFinalizeGameBody,
  toAppResult,
} from '@cityborn/client';
import { client } from './client';

export async function createSession(
  data: CreateSession,
): Promise<AppResult<Session>> {
  const result = await client.session.createSession({ body: data });
  return toAppResult(result);
}

export async function fetchSession(id: string): Promise<AppResult<Session>> {
  const result = await client.session.getSession({ params: { id } });
  return toAppResult(result);
}

export async function createSoloGame(
  session: Session,
): Promise<AppResult<Game>> {
  const result = await client.session.createGame({ body: session });
  return toAppResult(result);
}

export async function finalizeGame(session: Session): Promise<AppResult<void>> {
  const body = buildFinalizeGameBody(session);
  if (!body) return { ok: true, data: undefined };
  const result = await client.session.finalizeGame({ body });
  const apiResult = toAppResult(result);
  if (!apiResult.ok) return apiResult;
  return { ok: true, data: undefined };
}
