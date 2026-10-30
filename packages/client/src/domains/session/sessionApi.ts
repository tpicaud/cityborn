import type {
  CreateSession,
  Session,
  SessionId,
  sessionWsChannel,
} from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';
import type { WsChannelConnection } from '../../ws/wsChannelConnection';

export interface SessionApi {
  createSession(data: CreateSession): Promise<Session>;
  fetchSession(id: SessionId): Promise<Session>;
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
  };
}

export type SessionChannel = WsChannelConnection<typeof sessionWsChannel>;
