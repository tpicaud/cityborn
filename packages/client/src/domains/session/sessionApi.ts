import type {
  CreateSession,
  Game,
  GameConfig,
  Guess,
  PlayerId,
  Session,
  SessionId,
  SessionJoinAck,
  SessionReconnectToken,
} from '@cityborn/api';
import {
  type sessionWsChannel,
  sessionWsEvent,
  sessionWsServerEvent,
  unwrapApiResponse,
} from '@cityborn/api';
import { toLightGame } from '@cityborn/core';
import type { ContractClient } from '../../api/contractClient';
import type { WsChannelConnection } from '../../ws/wsChannelConnection';

type SessionMembership = {
  sessionID: SessionId;
  playerID: PlayerId;
};

type SessionReconnection = SessionMembership & {
  reconnectToken: SessionReconnectToken | undefined;
};

type SessionUpdateListener = (session: Session) => void;

type FinalizedSession = Session & {
  currentGame: NonNullable<Session['currentGame']>;
};

function buildFinalizeGameBody(session: Session): FinalizedSession | null {
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

export type SessionChannel = {
  join: (membership: SessionMembership) => Promise<SessionJoinAck>;
  reconnect: (reconnection: SessionReconnection) => Promise<void>;
  updateHost: (newHostID: PlayerId) => Promise<void>;
  updateGameConfig: (gameConfig: GameConfig) => Promise<void>;
  startGame: () => Promise<void>;
  guess: (guess: Guess) => Promise<void>;
  nextRound: () => Promise<void>;
  playAgain: () => Promise<void>;
  onSessionUpdate: (listener: SessionUpdateListener) => () => void;
};

export function createSessionChannel(
  connection: WsChannelConnection<typeof sessionWsChannel>,
): SessionChannel {
  return {
    join(membership) {
      return connection.emit(sessionWsEvent.join, membership);
    },

    async reconnect(reconnection) {
      await connection.emit(sessionWsEvent.reconnect, reconnection);
    },

    async updateHost(newHostID) {
      await connection.emit(sessionWsEvent.updateHost, { newHostID });
    },

    async updateGameConfig(gameConfig) {
      await connection.emit(sessionWsEvent.updateGameConfig, { gameConfig });
    },

    async startGame() {
      await connection.emit(sessionWsEvent.startGame);
    },

    async guess(guess) {
      await connection.emit(sessionWsEvent.guess, { guess });
    },

    async nextRound() {
      await connection.emit(sessionWsEvent.nextRound);
    },

    async playAgain() {
      await connection.emit(sessionWsEvent.playAgain);
    },

    onSessionUpdate(listener) {
      connection.on(sessionWsServerEvent.update, listener);
      return () => connection.off(sessionWsServerEvent.update, listener);
    },
  };
}
