import { type ErrorCode, getApiVersionInfo } from '@cityborn/api';
import type { Request } from 'express';
import { nanoid } from 'nanoid';

export type WideEventDomain =
  | 'system'
  | 'health'
  | 'auth'
  | 'session'
  | 'game'
  | 'user'
  | 'category'
  | 'guess_object'
  | 'search'
  | 'world_location'
  | 'sentence';

const httpWideEventContexts = {
  'GET /': { domain: 'system', operation: 'root' },
  'GET /health': { domain: 'health', operation: 'check' },
  'GET /auth/me': { domain: 'auth', operation: 'get_current_user' },
  'POST /auth/refresh': { domain: 'auth', operation: 'refresh' },
  'POST /auth/sign-up': { domain: 'auth', operation: 'sign_up' },
  'POST /auth/sign-in': { domain: 'auth', operation: 'sign_in' },
  'POST /auth/sign-in-with-google': {
    domain: 'auth',
    operation: 'sign_in_with_google',
  },
  'POST /auth/sign-in-with-apple': {
    domain: 'auth',
    operation: 'sign_in_with_apple',
  },
  'POST /auth/resend-verification-email': {
    domain: 'auth',
    operation: 'resend_verification_email',
  },
  'POST /auth/verify-email': { domain: 'auth', operation: 'verify_email' },
  'POST /auth/delete-user': { domain: 'auth', operation: 'delete_user' },
  'POST /session': { domain: 'session', operation: 'create' },
  'GET /session/:id': { domain: 'session', operation: 'get' },
  'POST /session/create-game': { domain: 'game', operation: 'create' },
  'POST /session/finalize-game': { domain: 'game', operation: 'finalize' },
  'POST /session/end-solo-game': { domain: 'game', operation: 'finalize' },
  'GET /user/game-records': { domain: 'user', operation: 'get_game_records' },
  'POST /user/game-records': { domain: 'user', operation: 'save_game_record' },
  'GET /category/tree': { domain: 'category', operation: 'get_trees' },
  'GET /category': { domain: 'category', operation: 'get_all' },
  'GET /category/:id': { domain: 'category', operation: 'get' },
  'GET /guess-object': { domain: 'guess_object', operation: 'get_all' },
  'GET /guess-object/:id': { domain: 'guess_object', operation: 'get' },
  'GET /sentence': { domain: 'sentence', operation: 'get_random' },
  'GET /admin/category/tree': {
    domain: 'category',
    operation: 'admin_get_trees',
  },
  'GET /admin/category': { domain: 'category', operation: 'admin_get_all' },
  'GET /admin/category/:id': { domain: 'category', operation: 'admin_get' },
  'GET /admin/category/:id/full': {
    domain: 'category',
    operation: 'admin_get_full',
  },
  'POST /admin/category': { domain: 'category', operation: 'admin_create' },
  'PUT /admin/category/:id': { domain: 'category', operation: 'admin_update' },
  'DELETE /admin/category/:id': {
    domain: 'category',
    operation: 'admin_delete',
  },
  'GET /admin/guess-object': {
    domain: 'guess_object',
    operation: 'admin_get_all',
  },
  'GET /admin/guess-object/:id': {
    domain: 'guess_object',
    operation: 'admin_get',
  },
  'GET /admin/guess-object/full': {
    domain: 'guess_object',
    operation: 'admin_get_all_full',
  },
  'GET /admin/guess-object/:id/full': {
    domain: 'guess_object',
    operation: 'admin_get_full',
  },
  'POST /admin/guess-object': {
    domain: 'guess_object',
    operation: 'admin_create',
  },
  'PATCH /admin/guess-object/:id': {
    domain: 'guess_object',
    operation: 'admin_update',
  },
  'DELETE /admin/guess-object/:id': {
    domain: 'guess_object',
    operation: 'admin_delete',
  },
  'GET /admin/search/guess-object': {
    domain: 'search',
    operation: 'search_guess_object',
  },
  'GET /admin/search/world-location': {
    domain: 'search',
    operation: 'search_world_location',
  },
  'POST /admin/world-location': {
    domain: 'world_location',
    operation: 'admin_create',
  },
} as const satisfies Record<
  string,
  { domain: WideEventDomain; operation: string }
>;

const wsWideEventContexts = {
  'session:join': { domain: 'session', operation: 'join' },
  'session:updateHost': { domain: 'session', operation: 'update_host' },
  'session:updateGameConfig': {
    domain: 'session',
    operation: 'update_game_config',
  },
  'session:kickPlayer': { domain: 'session', operation: 'kick_player' },
  'session:startGame': { domain: 'game', operation: 'start' },
  'session:guess': { domain: 'game', operation: 'guess' },
  'session:nextRound': { domain: 'game', operation: 'next_round' },
  'session:playAgain': { domain: 'game', operation: 'play_again' },
  'session:reconnect': { domain: 'session', operation: 'reconnect' },
} as const satisfies Record<
  string,
  { domain: WideEventDomain; operation: string }
>;

type HttpWideEventOperation =
  (typeof httpWideEventContexts)[keyof typeof httpWideEventContexts]['operation'];
type WsWideEventOperation =
  (typeof wsWideEventContexts)[keyof typeof wsWideEventContexts]['operation'];
export type WideEventOperation =
  | HttpWideEventOperation
  | WsWideEventOperation
  | 'unmapped_request'
  | 'route_not_found'
  | 'unknown_message';

export interface WideEventContext {
  domain: WideEventDomain;
  operation: WideEventOperation;
}

const httpWideEventContextByRoute: ReadonlyMap<string, WideEventContext> =
  new Map(Object.entries(httpWideEventContexts));
const wsWideEventContextByEvent: ReadonlyMap<string, WideEventContext> =
  new Map(Object.entries(wsWideEventContexts));

interface WideEventInitBase {
  requestId: string;
  ip: string | undefined;
  userAgent: string | undefined;
  visitorId: string | undefined;
  client: string | undefined;
  clientVersion: string | undefined;
  domain: WideEventDomain;
  operation: WideEventOperation;
}

export interface HttpWideEventInit extends WideEventInitBase {
  transport: 'http';
  method: string;
  route: string;
  apiVersion: number | undefined;
  isAuthenticated: boolean;
}

export interface WsWideEventInit extends WideEventInitBase {
  transport: 'ws';
  eventName: string;
  socketId: string;
}

export type WideEventInit = HttpWideEventInit | WsWideEventInit;

export interface WideEventEnrichment {
  route: string;
  domain: WideEventDomain;
  operation: WideEventOperation;
  userId: string;
  isAuthenticated: boolean;
  rateLimitBucket: string;
  rateLimitRemaining: number;
  statusCode: number;
  durationMs: number;
  errorCode: ErrorCode;
  errorMessage: string;
  errorStack: string;
  sessionId: string;
  playerId: string;
  gameId: string;
  outcome: WideEventOutcome;
}

export type WideEvent = WideEventInit & Partial<WideEventEnrichment>;

export type WideEventLevel = 'info' | 'warn' | 'error';

export type WideEventOutcome =
  | 'success'
  | 'client_error'
  | 'server_error'
  | 'aborted';

export type WideEventLogger = Record<
  WideEventLevel,
  (payload: object, message: string) => void
>;

export const WIDE_EVENT_LOGGER = Symbol('WIDE_EVENT_LOGGER');

const wideEventLogShape = {
  http: { event: 'http_request', message: 'request' },
  ws: { event: 'ws_message', message: 'message' },
} as const;

let cachedCurrentApiVersion: number | undefined;

function resolveApiVersion(req: Request): number | undefined {
  const rawHeader = req.headers['x-api-version'];
  const headerValue = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  const fromHeader =
    headerValue === undefined ? Number.NaN : Number(headerValue);
  if (Number.isInteger(fromHeader)) {
    return fromHeader;
  }

  if (cachedCurrentApiVersion === undefined) {
    cachedCurrentApiVersion = getApiVersionInfo().currentVersion;
  }
  return cachedCurrentApiVersion;
}

export function firstHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function createHttpWideEvent(req: Request): HttpWideEventInit {
  const route = req.route?.path;
  const requestId = typeof req.id === 'string' ? req.id : nanoid();

  return {
    transport: 'http',
    requestId,
    method: req.method,
    route: typeof route === 'string' ? route : '<unresolved>',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    visitorId: firstHeaderValue(req.headers['x-visitor-id']),
    client: firstHeaderValue(req.headers['x-client-name']),
    clientVersion: firstHeaderValue(req.headers['x-client-version']),
    domain: 'system',
    operation: 'unmapped_request',
    apiVersion: resolveApiVersion(req),
    isAuthenticated: false,
  };
}

export function createWsWideEvent(params: {
  eventName: string;
  socketId: string;
  ip: string | undefined;
  userAgent: string | undefined;
  visitorId: string | undefined;
  client: string | undefined;
  clientVersion: string | undefined;
}): WsWideEventInit {
  const context = resolveWsWideEventContext(params.eventName);

  return {
    transport: 'ws',
    requestId: nanoid(),
    eventName: params.eventName,
    socketId: params.socketId,
    ip: params.ip,
    userAgent: params.userAgent,
    visitorId: params.visitorId,
    client: params.client,
    clientVersion: params.clientVersion,
    ...context,
  };
}

export function resolveHttpWideEventContext(
  method: string,
  route: string,
): WideEventContext {
  if (route === '<unmatched>') {
    return { domain: 'system', operation: 'route_not_found' };
  }

  const normalizedRoute =
    route.length > 1 && route.endsWith('/') ? route.slice(0, -1) : route;
  const key = `${method} ${normalizedRoute}`;
  const context = httpWideEventContextByRoute.get(key);
  if (context) {
    return context;
  }
  return { domain: 'system', operation: 'unmapped_request' };
}

export function resolveWsWideEventContext(eventName: string): WideEventContext {
  const context = wsWideEventContextByEvent.get(eventName);
  if (context) {
    return context;
  }
  return { domain: 'system', operation: 'unknown_message' };
}

export function deriveWideEventLevel(
  outcome: WideEventOutcome,
): WideEventLevel {
  if (outcome === 'server_error') {
    return 'error';
  }
  if (outcome === 'client_error' || outcome === 'aborted') {
    return 'warn';
  }
  return 'info';
}

export function deriveWideEventOutcome(statusCode: number): WideEventOutcome {
  if (statusCode >= 500) {
    return 'server_error';
  }
  if (statusCode >= 400) {
    return 'client_error';
  }
  return 'success';
}

export function emitWideEventLine(
  logger: WideEventLogger,
  wideEvent: WideEvent,
): void {
  const outcome = wideEvent.outcome ?? 'success';
  const level = deriveWideEventLevel(outcome);
  const { event, message } = wideEventLogShape[wideEvent.transport];
  logger[level]({ ...wideEvent, event }, message);
}
