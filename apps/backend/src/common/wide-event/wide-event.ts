import { type ErrorCode, getApiVersionInfo } from '@cityborn/api';
import type { Request } from 'express';
import { nanoid } from 'nanoid';

interface WideEventInitBase {
  requestId: string;
  domain: WideEventDomain;
  operation: string;
  ip: string | undefined;
  userAgent: string | undefined;
  visitorId: string | undefined;
  client: string | undefined;
  clientVersion: string | undefined;
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
  userId: string;
  isAuthenticated: boolean;
  rateLimitBucket: WideEventRateLimitBucket;
  rateLimitRemaining: number;
  rateLimitStatus: WideEventRateLimitStatus;
  statusCode: number;
  outcome: WideEventOutcome;
  durationMs: number;
  errorCode: ErrorCode;
  errorMessage: string;
  errorStack: string;
  sessionId: string;
  playerId: string;
  gameId: string;
}

export type WideEvent = WideEventInit & Partial<WideEventEnrichment>;
export type WideEventUpdate = Partial<WideEventEnrichment> & {
  domain?: WideEventDomain;
  operation?: string;
  route?: string;
};

export type WideEventLevel = 'info' | 'warn' | 'error';

export type WideEventDomain =
  | 'auth'
  | 'category'
  | 'game'
  | 'guess_object'
  | 'health'
  | 'search'
  | 'sentence'
  | 'session'
  | 'user'
  | 'world_location'
  | 'other';

export type WideEventOutcome =
  | 'success'
  | 'client_error'
  | 'server_error'
  | 'aborted';

export type WideEventRateLimitBucket = 'rl:http' | 'rl:ws:msg';

export type WideEventRateLimitStatus = 'allowed' | 'rejected' | 'bypassed';

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
function resolveRequestId(req: Request): string {
  if ('id' in req && typeof req.id === 'string') {
    return req.id;
  }
  if ('id' in req && typeof req.id === 'number') {
    return String(req.id);
  }
  return nanoid();
}

function domainFromSegment(segment: string | undefined): WideEventDomain {
  switch (segment) {
    case 'auth':
      return 'auth';
    case 'category':
      return 'category';
    case 'game':
    case 'game-records':
      return 'game';
    case 'guess-object':
      return 'guess_object';
    case 'health':
      return 'health';
    case 'search':
      return 'search';
    case 'sentence':
      return 'sentence';
    case 'session':
      return 'session';
    case 'user':
      return 'user';
    case 'world-location':
      return 'world_location';
    default:
      return 'other';
  }
}

export function deriveHttpDomain(route: string): WideEventDomain {
  const segments = route.split('/').filter(Boolean);
  const firstDomainSegment = segments.find(
    (segment) => segment !== 'admin' && !/^v\d+$/.test(segment),
  );
  return domainFromSegment(firstDomainSegment);
}

export function deriveWsDomain(eventName: string): WideEventDomain {
  return domainFromSegment(eventName.split(':', 1)[0]);
}

export function deriveWideEventOutcome(
  statusCode: number | undefined,
  aborted = false,
): WideEventOutcome {
  if (aborted) {
    return 'aborted';
  }
  if (statusCode !== undefined && statusCode >= 500) {
    return 'server_error';
  }
  if (statusCode !== undefined && statusCode >= 400) {
    return 'client_error';
  }
  return 'success';
}

export function resolveHttpRoute(req: Request, statusCode?: number): string {
  const route = req.route?.path;
  if (typeof route === 'string' && !route.includes('*splat')) {
    return route;
  }
  if (statusCode === 404) {
    return '<unmatched>';
  }
  return req.path ?? req.originalUrl.split('?', 1)[0];
}

export function firstHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function createHttpWideEvent(req: Request): HttpWideEventInit {
  const route = resolveHttpRoute(req);
  return {
    transport: 'http',
    requestId: resolveRequestId(req),
    domain: deriveHttpDomain(route),
    operation: `${req.method} ${route}`,
    method: req.method,
    route,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    visitorId: firstHeaderValue(req.headers['x-visitor-id']),
    client: firstHeaderValue(req.headers['x-client-name']),
    clientVersion: firstHeaderValue(req.headers['x-client-version']),
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
  return {
    transport: 'ws',
    requestId: nanoid(),
    domain: deriveWsDomain(params.eventName),
    operation: params.eventName,
    eventName: params.eventName,
    socketId: params.socketId,
    ip: params.ip,
    userAgent: params.userAgent,
    visitorId: params.visitorId,
    client: params.client,
    clientVersion: params.clientVersion,
  };
}

export function deriveWideEventLevel(
  statusCode: number | undefined,
  outcome?: WideEventOutcome,
): WideEventLevel {
  if (outcome === 'aborted') {
    return 'warn';
  }
  if (statusCode === undefined) {
    return 'info';
  }
  if (statusCode >= 500) {
    return 'error';
  }
  if (statusCode >= 400) {
    return 'warn';
  }
  return 'info';
}

export function emitWideEventLine(
  logger: WideEventLogger,
  wideEvent: WideEvent,
): void {
  const level = deriveWideEventLevel(wideEvent.statusCode, wideEvent.outcome);
  const { event, message } = wideEventLogShape[wideEvent.transport];
  logger[level]({ ...wideEvent, event }, message);
}
