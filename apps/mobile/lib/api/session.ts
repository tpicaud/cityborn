import { buildEndSoloGameBody, throwOnError, type Game, type Session, type SessionMode } from '@cityborn/api';
import { assertOk, client } from './client';

export async function createSession(mode: SessionMode): Promise<Session> {
  const result = await client.session.createSession({ body: { mode } });
  assertOk(result);
  return result.body;
}

export async function fetchSession(id: string): Promise<Session> {
  const result = await client.session.getSession({ params: { id } });
  assertOk(result);
  return result.body;
}

export async function createSoloGame(session: Session): Promise<Game> {
  const result = await client.session.createGame({ body: session });
  assertOk(result);
  return result.body;
}

export async function endSoloGame(session: Session): Promise<void> {
  const body = buildEndSoloGameBody(session);
  if (!body) return;
  const result = await client.session.endSoloGame({ body });
  throwOnError(result);
}
