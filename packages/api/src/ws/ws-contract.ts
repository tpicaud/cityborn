import type { ApiDomain } from '../contract/api-domain';
import { ApiErrorSchema } from '../schemas/api-error.schema';
import { sessionWsChannel } from './session.ws-contract';
import type { WsChannel, WsServerEvent } from './ws-channel';

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
