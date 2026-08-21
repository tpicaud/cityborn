import {
  type ApiResult,
  type CreateSession,
  type Game,
  type Session,
  toApiResult,
} from '@cityborn/api';
import { buildFinalizeGameBody } from '@cityborn/client';
import { client } from './client';

export async function createSession(
  data: CreateSession,
): Promise<ApiResult<Session>> {
  const result = await client.session.createSession({ body: data });
  return toApiResult(result);
}

export async function fetchSession(id: string): Promise<ApiResult<Session>> {
  const result = await client.session.getSession({ params: { id } });
  return toApiResult(result);
}

export async function createSoloGame(
  session: Session,
): Promise<ApiResult<Game>> {
  const result = await client.session.createGame({ body: session });
  return toApiResult(result);
}

export async function finalizeGame(session: Session): Promise<ApiResult<void>> {
  const body = buildFinalizeGameBody(session);
  if (!body) return { ok: true, data: undefined };
  const result = await client.session.finalizeGame({ body });
  const apiResult = toApiResult(result);
  if (!apiResult.ok) return apiResult;
  return { ok: true, data: undefined };
}
