import type { AnyZodObject } from 'zod';
import type { ApiDomain } from '../contract/api-domain';

/** Event client → serveur : corps émis et données portées par l'ack de succès. */
export interface WsClientEvent {
  readonly payload?: AnyZodObject;
  readonly ack?: AnyZodObject;
}

/** Event serveur → client : corps diffusé aux sockets. */
export interface WsServerEvent {
  readonly payload?: AnyZodObject;
}

/**
 * Regroupe les events d'un domaine métier. Le nom de fil d'un event est dérivé
 * du domaine et de sa clé : `session` + `guess` donne `session:guess`.
 */
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

/** Nom de fil d'un event, seule source des chaînes échangées sur la socket. */
export function wsEventName<
  Channel extends WsChannel,
  Event extends WsChannelClientEvent<Channel> | WsChannelServerEvent<Channel>,
>(channel: Channel, event: Event): WsChannelEventName<Channel, Event> {
  return `${channel.domain}:${event}`;
}
