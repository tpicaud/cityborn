import type {
  ApiResult,
  CreateSession,
  Game,
  Session,
  SessionId,
} from '@cityborn/api';
import { toApiResult } from '@cityborn/api';
import { toLightGame } from '@cityborn/core';
import type { ApiClient } from '../../api/createApiClient';

type FinalizedSession = Session & {
  currentGame: NonNullable<Session['currentGame']>;
};

export function buildFinalizeGameBody(
  session: Session,
): FinalizedSession | null {
  if (!session.currentGame) return null;
  return { ...session, currentGame: toLightGame(session.currentGame) };
}

export interface SessionApi {
  createSession(data: CreateSession): Promise<ApiResult<Session>>;
  fetchSession(id: SessionId): Promise<ApiResult<Session>>;
  createSoloGame(session: Session): Promise<ApiResult<Game>>;
  finalizeGame(session: Session): Promise<ApiResult<void>>;
}

export function createSessionApi(
  client: Pick<ApiClient, 'session'>,
): SessionApi {
  return {
    async createSession(data) {
      return toApiResult(await client.session.createSession({ body: data }));
    },

    async fetchSession(id) {
      return toApiResult(await client.session.getSession({ params: { id } }));
    },

    async createSoloGame(session) {
      return toApiResult(await client.session.createGame({ body: session }));
    },

    async finalizeGame(session) {
      const body = buildFinalizeGameBody(session);
      if (!body) return { ok: true, data: undefined };
      const result = toApiResult(await client.session.finalizeGame({ body }));
      if (!result.ok) return result;
      return { ok: true, data: undefined };
    },
  };
}
