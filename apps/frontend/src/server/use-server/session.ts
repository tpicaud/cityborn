'use server';

import {
  type ApiResult,
  type CreateSession,
  type Game,
  type Session,
  toApiResult,
} from '@cityborn/api';
import { buildFinalizeGameBody } from '@cityborn/client';
import { getServerClient } from '@/lib/serverClient';

export async function createSession(
  data: CreateSession,
): Promise<ApiResult<Session>> {
  const client = await getServerClient();
  const result = await client.session.createSession({ body: data });
  return toApiResult(result);
}

export async function fetchSession(
  sessionId: string,
): Promise<ApiResult<Session>> {
  const client = await getServerClient();
  const result = await client.session.getSession({ params: { id: sessionId } });
  return toApiResult(result);
}

export async function createSoloGame(
  session: Session,
): Promise<ApiResult<Game>> {
  const client = await getServerClient();
  const result = await client.session.createGame({ body: session });
  return toApiResult(result);
}

export async function finalizeGame(session: Session): Promise<ApiResult<void>> {
  const body = buildFinalizeGameBody(session);
  if (!body) return { ok: true, data: undefined };
  const client = await getServerClient();
  const result = await client.session.finalizeGame({ body });
  const r = toApiResult(result);
  if (!r.ok) return r;
  return { ok: true, data: undefined };
}
