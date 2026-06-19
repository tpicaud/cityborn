import {
  buildEndSoloGameBody,
  type CreateSession,
  type Game,
  type Session,
  throwOnError,
} from '@cityborn/api';
import { client } from './client';

export async function createSession(data: CreateSession): Promise<Session> {
  const result = await client.session.createSession({ body: data });
  throwOnError(result);
  return result.body;
}

export async function fetchSession(id: string): Promise<Session> {
  const result = await client.session.getSession({ params: { id } });
  throwOnError(result);
  return result.body;
}

export async function createSoloGame(session: Session): Promise<Game> {
  const result = await client.session.createGame({ body: session });
  throwOnError(result);
  return result.body;
}

export async function endSoloGame(session: Session): Promise<void> {
  const body = buildEndSoloGameBody(session);
  if (!body) return;
  const result = await client.session.endSoloGame({ body });
  throwOnError(result);
}
