import type { AnyZodObject, z } from 'zod';
import type { WsAck } from './ws-ack.schema';
import type {
  WsChannel,
  WsChannelClientEvent,
  WsChannelEventName,
  WsChannelServerEvent,
  WsClientEvent,
  WsServerEvent,
} from './ws-channel';
import { wsChannels, wsSharedServerEvents } from './ws-contract';

type WsChannelsMap = typeof wsChannels;

interface WsEventRef<Name extends string, Definition> {
  readonly name: Name;
  readonly definition: Definition;
}

type ChannelClientEventRefs<Channel extends WsChannel> = {
  [Event in WsChannelClientEvent<Channel>]: WsEventRef<
    WsChannelEventName<Channel, Event>,
    Channel['clientToServer'][Event]
  >;
}[WsChannelClientEvent<Channel>];

type ChannelServerEventRefs<Channel extends WsChannel> = {
  [Event in WsChannelServerEvent<Channel>]: WsEventRef<
    WsChannelEventName<Channel, Event>,
    Channel['serverToClient'][Event]
  >;
}[WsChannelServerEvent<Channel>];

type SharedServerEventRefs = {
  [Event in keyof typeof wsSharedServerEvents & string]: WsEventRef<
    Event,
    (typeof wsSharedServerEvents)[Event]
  >;
}[keyof typeof wsSharedServerEvents & string];

type ClientEventRefs = {
  [Domain in keyof WsChannelsMap]: ChannelClientEventRefs<
    WsChannelsMap[Domain]
  >;
}[keyof WsChannelsMap];

type ServerEventRefs =
  | {
      [Domain in keyof WsChannelsMap]: ChannelServerEventRefs<
        WsChannelsMap[Domain]
      >;
    }[keyof WsChannelsMap]
  | SharedServerEventRefs;

type WsClientEventDefinitions = {
  [Ref in ClientEventRefs as Ref['name']]: Ref['definition'];
};

type WsServerEventDefinitions = {
  [Ref in ServerEventRefs as Ref['name']]: Ref['definition'];
};

export type WsClientEventName = keyof WsClientEventDefinitions & string;
export type WsServerEventName = keyof WsServerEventDefinitions & string;

type PayloadArgs<Definition> = Definition extends {
  payload: infer Payload extends AnyZodObject;
}
  ? [payload: z.infer<Payload>]
  : [];

export type WsPayloadArgs<Name extends WsClientEventName> = PayloadArgs<
  WsClientEventDefinitions[Name]
>;

export type WsAckOf<Name extends WsClientEventName> =
  WsClientEventDefinitions[Name] extends { ack: infer Ack extends AnyZodObject }
    ? WsAck<Ack>
    : WsAck;

export type WsAckCallback<Name extends WsClientEventName> = (
  ack: WsAckOf<Name>,
) => void;

export type WsEmitArgs<Name extends WsClientEventName> = [
  ...WsPayloadArgs<Name>,
  ack: WsAckCallback<Name>,
];

export type WsClientToServerEvents = {
  [Name in WsClientEventName]: (...args: WsEmitArgs<Name>) => void;
};

export type WsServerToClientEvents = {
  [Name in WsServerEventName]: (
    ...args: PayloadArgs<WsServerEventDefinitions[Name]>
  ) => void;
};

/** Corps attendu par un handler backend pour un event du contrat. */
export type WsPayload<
  Channel extends WsChannel,
  Event extends WsChannelClientEvent<Channel>,
> = PayloadArgs<Channel['clientToServer'][Event]>[0];

/** Assemble les arguments socket.io d'une émission : corps puis accusé. */
export function wsEmitArgs<Name extends WsClientEventName>(
  payload: WsPayloadArgs<Name>,
  ack: WsAckCallback<Name>,
): WsEmitArgs<Name> {
  return [...payload, ack];
}

function collectClientEventDefinitions(): Record<string, WsClientEvent> {
  return Object.fromEntries(
    Object.values(wsChannels).flatMap((channel) =>
      Object.entries(channel.clientToServer).map(([event, definition]) => [
        `${channel.domain}:${event}`,
        definition,
      ]),
    ),
  );
}

function collectServerEventDefinitions(): Record<string, WsServerEvent> {
  return Object.fromEntries([
    ...Object.entries(wsSharedServerEvents),
    ...Object.values(wsChannels).flatMap((channel) =>
      Object.entries(channel.serverToClient).map(([event, definition]) => [
        `${channel.domain}:${event}`,
        definition,
      ]),
    ),
  ]);
}

/** Définitions indexées par nom de fil, pour la validation au runtime. */
export const wsClientEventDefinitions: Readonly<Record<string, WsClientEvent>> =
  collectClientEventDefinitions();

export const wsServerEventDefinitions: Readonly<Record<string, WsServerEvent>> =
  collectServerEventDefinitions();
