import { z } from 'zod';
import {
  GameConfigSchema,
  GuessSchema,
  GuessSubmissionSchema,
} from '../game/game.schema';
import { PlayerIdSchema } from '../player/player.schema';
import {
  type WsChannel,
  type WsClientEventNames,
  type WsServerEventNames,
  wsEventName,
} from '../ws/channel';
import {
  SessionIdSchema,
  SessionReconnectTokenSchema,
  SessionSchema,
} from './session.schema';

const SessionMembershipSchema = z.object({
  sessionID: SessionIdSchema,
  playerID: PlayerIdSchema,
});

export const SessionJoinAckSchema = z.object({
  reconnectToken: SessionReconnectTokenSchema.optional(),
});

const SessionReconnectionSchema = SessionMembershipSchema.extend({
  reconnectToken: SessionReconnectTokenSchema.optional(),
});

export type SessionJoinAck = z.infer<typeof SessionJoinAckSchema>;

export const sessionWsChannel = {
  domain: 'session',
  clientToServer: {
    join: { payload: SessionMembershipSchema, ack: SessionJoinAckSchema },
    reconnect: { payload: SessionReconnectionSchema },
    updateHost: { payload: z.object({ newHostID: PlayerIdSchema }) },
    updateGameConfig: { payload: z.object({ gameConfig: GameConfigSchema }) },
    startGame: {},
    /**
     * @deprecated Utiliser `submitGuess` à la place. Conservé pour les builds
     * mobile publiées avant le calcul des scores côté serveur.
     * @deprecatedSince 2026-10-28
     */
    guess: { payload: z.object({ guess: GuessSchema }), deprecated: true },
    submitGuess: {
      payload: z.object({ guess: GuessSubmissionSchema }).strict(),
    },
    nextRound: {},
    playAgain: {},
  },
  serverToClient: {
    update: { payload: SessionSchema },
  },
} as const satisfies WsChannel<'session'>;

export const sessionWsEvent = {
  join: wsEventName(sessionWsChannel, 'join'),
  reconnect: wsEventName(sessionWsChannel, 'reconnect'),
  updateHost: wsEventName(sessionWsChannel, 'updateHost'),
  updateGameConfig: wsEventName(sessionWsChannel, 'updateGameConfig'),
  startGame: wsEventName(sessionWsChannel, 'startGame'),
  guess: wsEventName(sessionWsChannel, 'guess'),
  submitGuess: wsEventName(sessionWsChannel, 'submitGuess'),
  nextRound: wsEventName(sessionWsChannel, 'nextRound'),
  playAgain: wsEventName(sessionWsChannel, 'playAgain'),
} satisfies WsClientEventNames<typeof sessionWsChannel>;

export const sessionWsServerEvent = {
  update: wsEventName(sessionWsChannel, 'update'),
} satisfies WsServerEventNames<typeof sessionWsChannel>;
