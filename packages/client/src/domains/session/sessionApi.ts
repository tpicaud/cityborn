import type {
  CreateSession,
  GameConfig,
  GuessSubmission,
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
  UserFacingError,
  unwrapApiResponse,
} from '@cityborn/api';
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
        await contractClient.session.createSession({
          body: { ...data, scoringProtocol: 'server-scoring' },
        }),
      );
    },

    async fetchSession(id) {
      const session: Session = unwrapApiResponse(
        await contractClient.session.getSession({ params: { id } }),
      );
      if (session.scoringProtocol !== 'server-scoring')
        throw new UserFacingError(
          'Cette session utilise une ancienne version du jeu. Créez une nouvelle session.',
        );
      return session;
    },
  };
}

export type SessionChannel = {
  join: (membership: SessionMembership) => Promise<SessionJoinAck>;
  reconnect: (reconnection: SessionReconnection) => Promise<void>;
  updateHost: (newHostID: PlayerId) => Promise<void>;
  updateGameConfig: (gameConfig: GameConfig) => Promise<void>;
  startGame: () => Promise<void>;
  guess: (guess: GuessSubmission) => Promise<void>;
  nextRound: () => Promise<void>;
  playAgain: () => Promise<void>;
  onSessionUpdate: (listener: SessionUpdateListener) => () => void;
};

export function createSessionChannel(
  connection: WsChannelConnection<typeof sessionWsChannel>,
): SessionChannel {
  return {
    join(membership) {
      return connection.emit(sessionWsEvent.join, {
        ...membership,
        scoringProtocol: 'server-scoring',
      });
    },

    async reconnect(reconnection) {
      await connection.emit(sessionWsEvent.reconnect, {
        ...reconnection,
        scoringProtocol: 'server-scoring',
      });
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
      await connection.emit(sessionWsEvent.submitGuess, { guess });
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
