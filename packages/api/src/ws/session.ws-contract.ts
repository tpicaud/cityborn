import { z } from 'zod';
import { PlayerIdSchema, SessionIdSchema } from '../schemas/common.schema';
import { GameConfigSchema, GuessSchema } from '../schemas/game.schema';
import { SessionSchema } from '../schemas/session.schema';
import type {
  WsChannel,
  WsClientEventNames,
  WsServerEventNames,
} from './ws-channel';
import { wsEventName } from './ws-channel';

const SessionMembershipSchema = z.object({
  sessionID: SessionIdSchema,
  playerID: PlayerIdSchema,
});

export const sessionWsChannel = {
  domain: 'session',
  clientToServer: {
    join: { payload: SessionMembershipSchema },
    reconnect: { payload: SessionMembershipSchema },
    updateHost: { payload: z.object({ newHostID: PlayerIdSchema }) },
    updateGameConfig: { payload: z.object({ gameConfig: GameConfigSchema }) },
    kickPlayer: { payload: z.object({ playerToKick: PlayerIdSchema }) },
    startGame: {},
    guess: { payload: z.object({ guess: GuessSchema }) },
    nextRound: {},
    playAgain: {},
  },
  serverToClient: {
    update: { payload: SessionSchema },
    kicked: {},
  },
} as const satisfies WsChannel<'session'>;

export const sessionWsEvent = {
  join: wsEventName(sessionWsChannel, 'join'),
  reconnect: wsEventName(sessionWsChannel, 'reconnect'),
  updateHost: wsEventName(sessionWsChannel, 'updateHost'),
  updateGameConfig: wsEventName(sessionWsChannel, 'updateGameConfig'),
  kickPlayer: wsEventName(sessionWsChannel, 'kickPlayer'),
  startGame: wsEventName(sessionWsChannel, 'startGame'),
  guess: wsEventName(sessionWsChannel, 'guess'),
  nextRound: wsEventName(sessionWsChannel, 'nextRound'),
  playAgain: wsEventName(sessionWsChannel, 'playAgain'),
} satisfies WsClientEventNames<typeof sessionWsChannel>;

export const sessionWsServerEvent = {
  update: wsEventName(sessionWsChannel, 'update'),
  kicked: wsEventName(sessionWsChannel, 'kicked'),
} satisfies WsServerEventNames<typeof sessionWsChannel>;
