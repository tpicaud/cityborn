import type { AnyZodObject } from 'zod';
import type { ApiDomain } from '../contract/api-domain';

export interface WsClientEvent {
  readonly payload?: AnyZodObject;
  readonly ack?: AnyZodObject;
}

export interface WsServerEvent {
  readonly payload?: AnyZodObject;
}

export interface WsChannel<Domain extends ApiDomain = ApiDomain> {
  readonly domain: Domain;
  readonly clientToServer: Readonly<Record<string, WsClientEvent>>;
  readonly serverToClient: Readonly<Record<string, WsServerEvent>>;
}

export type WsChannelClientEvent<Channel extends WsChannel> =
  keyof Channel['clientToServer'] & string;

export type WsChannelServerEvent<Channel extends WsChannel> =
  keyof Channel['serverToClient'] & string;

export type WsChannelEventName<
  Channel extends WsChannel,
  Event extends string,
> = `${Channel['domain']}:${Event}`;

export type WsClientEventNames<Channel extends WsChannel> = {
  readonly [Event in WsChannelClientEvent<Channel>]: WsChannelEventName<
    Channel,
    Event
  >;
};

export type WsServerEventNames<Channel extends WsChannel> = {
  readonly [Event in WsChannelServerEvent<Channel>]: WsChannelEventName<
    Channel,
    Event
  >;
};

export function wsEventName<
  Channel extends WsChannel,
  Event extends WsChannelClientEvent<Channel> | WsChannelServerEvent<Channel>,
>(channel: Channel, event: Event): WsChannelEventName<Channel, Event> {
  return `${channel.domain}:${event}`;
}
