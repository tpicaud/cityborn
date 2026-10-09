import type { CreateSession, Game, Session, SessionId } from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import { toLightGame } from '@cityborn/core';
import type { ContractClient } from '../../../api/contractClient';

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
  createSession(data: CreateSession): Promise<Session>;
  fetchSession(id: SessionId): Promise<Session>;
  createSoloGame(session: Session): Promise<Game>;
  finalizeGame(session: Session): Promise<void>;
}

export function createSessionApi(
  contractClient: Pick<ContractClient, 'session'>,
): SessionApi {
  return {
    async createSession(data) {
      return unwrapApiResponse(
        await contractClient.session.createSession({ body: data }),
      );
    },

    async fetchSession(id) {
      return unwrapApiResponse(
        await contractClient.session.getSession({ params: { id } }),
      );
    },

    async createSoloGame(session) {
      return unwrapApiResponse(
        await contractClient.session.createGame({ body: session }),
      );
    },

    async finalizeGame(session) {
      const body: FinalizedSession | null = buildFinalizeGameBody(session);
      if (!body) return;
      unwrapApiResponse(await contractClient.session.finalizeGame({ body }));
    },
  };
}
