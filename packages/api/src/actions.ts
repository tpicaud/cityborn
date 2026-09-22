import { type AppRoute, type AppRouter, isAppRoute } from '@ts-rest/core';
import { contract } from './contract/contract';
import type { WsChannel } from './ws/channel';
import { wsChannels } from './ws/registry';
import type { WsClientEventName } from './ws/socket-events';

type StripAdmin<Path extends string> = Path extends `/admin/${infer Rest}`
  ? Rest
  : Path extends `/${infer Rest}`
    ? Rest
    : Path;

type FirstSegment<Path extends string> =
  Path extends `${infer Segment}/${string}` ? Segment : Path;

type DomainOf<Path extends string> = FirstSegment<StripAdmin<Path>>;

export type HttpActionsOf<Router> = {
  [Key in keyof Router & string]: Router[Key] extends {
    method: string;
    path: infer Path extends string;
  }
    ? Path extends `/admin/${string}`
      ? `admin.${DomainOf<Path>}.${Key}`
      : `${DomainOf<Path>}.${Key}`
    : HttpActionsOf<Router[Key]>;
}[keyof Router & string];

export type HttpAction = HttpActionsOf<typeof contract>;

export type WsAction = {
  [Domain in keyof typeof wsChannels]: {
    [Event in keyof (typeof wsChannels)[Domain]['clientToServer'] &
      string]: `${(typeof wsChannels)[Domain]['domain']}.${Event}`;
  }[keyof (typeof wsChannels)[Domain]['clientToServer'] & string];
}[keyof typeof wsChannels];

export type WsLifecycleAction =
  `${(typeof wsChannels)[keyof typeof wsChannels]['domain']}.${'connect' | 'disconnect'}`;

export type WsLifecycleEventName =
  `${(typeof wsChannels)[keyof typeof wsChannels]['domain']}:${'connect' | 'disconnect'}`;

export type ContractAction = HttpAction | WsAction | WsLifecycleAction;

export interface HttpActionRoute {
  method: string;
  path: string;
  action: string;
}

function normalizeHttpPath(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}

function domainFromPath(path: string): string {
  const segments: string[] = path.split('/').filter(Boolean);
  return segments[segments[0] === 'admin' ? 1 : 0] ?? '';
}

function collectHttpActionRoutes(router: AppRouter): HttpActionRoute[] {
  return Object.entries(router).flatMap(
    ([key, entry]: [string, AppRoute | AppRouter]): HttpActionRoute[] => {
      if (isAppRoute(entry)) {
        const path: string = normalizeHttpPath(entry.path);
        const domain: string = domainFromPath(path);
        const action: string = `${path.startsWith('/admin/') ? 'admin.' : ''}${domain}.${key}`;
        return [{ method: entry.method, path, action }];
      }
      return collectHttpActionRoutes(entry);
    },
  );
}

export const httpActionRoutes: readonly HttpActionRoute[] =
  collectHttpActionRoutes(contract);

const httpActionIndex: ReadonlyMap<string, string> = new Map(
  httpActionRoutes.map(
    ({ method, path, action }: HttpActionRoute): [string, string] => [
      `${method} ${path}`,
      action,
    ],
  ),
);

const httpActionValues: ReadonlySet<string> = new Set(
  httpActionRoutes.map(({ action }: HttpActionRoute) => action),
);

function isHttpAction(action: string): action is HttpAction {
  return httpActionValues.has(action);
}

export function resolveHttpAction(
  method: string,
  route: string,
): HttpAction | undefined {
  const action: string | undefined = httpActionIndex.get(
    `${method} ${normalizeHttpPath(route)}`,
  );
  return action !== undefined && isHttpAction(action) ? action : undefined;
}

const wsActionIndex: ReadonlyMap<string, string> = new Map(
  Object.values(wsChannels).flatMap((channel) => [
    ...Object.keys(channel.clientToServer).map(
      (event: string): [string, string] => [
        `${channel.domain}:${event}`,
        `${channel.domain}.${event}`,
      ],
    ),
    ...['connect', 'disconnect'].map((event: string): [string, string] => [
      `${channel.domain}:${event}`,
      `${channel.domain}.${event}`,
    ]),
  ]),
);

const wsActionValues: ReadonlySet<string> = new Set(wsActionIndex.values());

function isWsAction(action: string): action is WsAction | WsLifecycleAction {
  return wsActionValues.has(action);
}

export function isWsWideEventName(
  eventName: string,
): eventName is WsClientEventName | WsLifecycleEventName {
  return wsActionIndex.has(eventName);
}

export function resolveWsAction(
  eventName: string,
): WsAction | WsLifecycleAction | undefined {
  const action: string | undefined = wsActionIndex.get(eventName);
  return action !== undefined && isWsAction(action) ? action : undefined;
}

export function wsLifecycleEventName<
  Channel extends WsChannel,
  Event extends 'connect' | 'disconnect',
>(channel: Channel, event: Event): `${Channel['domain']}:${Event}` {
  return `${channel.domain}:${event}`;
}
