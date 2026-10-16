import type { ApiDomain } from '../../protocol/api-domain';
import { sessionWsChannel } from '../../session/session.channel';
import type { WsChannel, WsServerEvent } from '../../ws/channel';
import { ApiErrorSchema } from '../errors/api-error.schema';

export type WsChannels = {
  readonly [Domain in ApiDomain]?: WsChannel<Domain>;
};

export const wsChannels = {
  session: sessionWsChannel,
} satisfies WsChannels;

export const WS_ERROR_EVENT = 'error';

export const wsSharedServerEvents = {
  [WS_ERROR_EVENT]: { payload: ApiErrorSchema },
} satisfies Readonly<Record<string, WsServerEvent>>;
