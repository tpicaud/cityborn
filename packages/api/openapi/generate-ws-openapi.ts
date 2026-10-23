import type { AppRoute, AppRouter } from '@ts-rest/core';
import { generateOpenApi } from '@ts-rest/open-api';
import type { OpenAPIObject } from 'openapi3-ts';
import { z } from 'zod';
import packageJson from '../package.json';
import { wsAckSchema } from '../src/contract/ws/ack.schema';
import { wsChannels, wsSharedServerEvents } from '../src/contract/ws/registry';
import type { WsChannel, WsServerEvent } from '../src/ws/channel';

export type WsOpenApiOptions = {
  channels?: readonly WsChannel[];
  sharedServerEvents?: Readonly<Record<string, WsServerEvent>>;
};

export function getWsOpenApiDocument({
  channels = Object.values(wsChannels),
  sharedServerEvents = wsSharedServerEvents,
}: WsOpenApiOptions = {}): OpenAPIObject {
  const routes: AppRouter = Object.fromEntries([
    ...channels.flatMap((channel) => [
      ...Object.entries(channel.clientToServer).map(
        ([event, definition]): [string, AppRoute] => [
          `${channel.domain}:${event}:client`,
          {
            method: 'POST',
            path: `/ws/${channel.domain}/${event}`,
            body: definition.payload ?? z.object({}),
            responses: { 200: wsAckSchema(definition.ack ?? z.object({})) },
            deprecated: definition.deprecated,
          },
        ],
      ),
      ...Object.entries(channel.serverToClient).map(
        ([event, definition]): [string, AppRoute] => [
          `${channel.domain}:${event}:server`,
          {
            method: 'GET',
            path: `/ws/${channel.domain}/${event}`,
            responses: { 200: definition.payload ?? z.object({}) },
            deprecated: definition.deprecated,
          },
        ],
      ),
    ]),
    ...Object.entries(sharedServerEvents).map(
      ([event, definition]): [string, AppRoute] => [
        `shared:${event}:server`,
        {
          method: 'GET',
          path: `/ws/${event}`,
          responses: { 200: definition.payload ?? z.object({}) },
          deprecated: definition.deprecated,
        },
      ],
    ),
  ]);

  return generateOpenApi(routes, {
    info: { title: 'Cityborn WebSocket API', version: packageJson.version },
  });
}
