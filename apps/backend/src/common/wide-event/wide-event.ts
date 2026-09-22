import {
  API_DOMAINS,
  type ApiDomain,
  type ContractAction,
  type ErrorCode,
  getApiVersionInfo,
  isWsWideEventName,
  resolveHttpAction,
  resolveWsAction,
  type WsClientEventName,
  type WsLifecycleEventName,
} from '@cityborn/api';
import type { Request } from 'express';
import { nanoid } from 'nanoid';
import type { ErrorDiagnostic } from '../errors/exception-to-api-error';

interface WideEventInitBase {
  requestId: string;
  domain: WideEventDomain;
  operation: string;
  action?: ContractAction;
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
  kind: WsWideEventKind;
  eventName: WsClientEventName | WsLifecycleEventName;
  socketId: string;
}

export type WsWideEventKind = 'message' | 'connection' | 'disconnection';

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
  errorCauses: ErrorDiagnostic['causes'];
  sessionId: string;
  playerId: string;
  gameId: string;
}

export type WideEvent = WideEventInit & Partial<WideEventEnrichment>;

export type WideEventFinalized = WideEvent &
  Required<Pick<WideEventEnrichment, 'statusCode' | 'outcome' | 'durationMs'>>;

export interface WideEventFinalization {
  statusCode?: number;
  aborted?: boolean;
  route?: string;
}

export interface WideEventOperationContext {
  domain: WideEventDomain;
  operation: string;
  userId?: string;
}

export interface OperationErrorWideEvent extends WideEventOperationContext {
  event: 'operation_error';
  requestId?: string;
  statusCode: number;
  outcome: WideEventOutcome;
  errorCode: ErrorCode;
  errorMessage: string;
  errorStack?: string;
  errorCauses?: ErrorDiagnostic['causes'];
}

export type WideEventAuthContext =
  | { isAuthenticated: false; userId?: never }
  | { isAuthenticated: true; userId: string };

export type WideEventRateLimitContext =
  | {
      rateLimitBucket: WideEventRateLimitBucket;
      rateLimitStatus: 'allowed';
      rateLimitRemaining: number;
    }
  | {
      rateLimitBucket: WideEventRateLimitBucket;
      rateLimitStatus: 'rejected';
      rateLimitRemaining: 0;
    }
  | {
      rateLimitBucket: WideEventRateLimitBucket;
      rateLimitStatus: 'pending' | 'failed';
      rateLimitRemaining?: never;
    };

interface WideEventBusinessFields {
  sessionId: string;
  playerId: string;
  gameId: string;
}

type AtLeastOne<T> = {
  [Key in keyof T]-?: Required<Pick<T, Key>> & Partial<Omit<T, Key>>;
}[keyof T];

export type WideEventBusinessContext = AtLeastOne<WideEventBusinessFields>;

export type WideEventLevel = 'info' | 'warn' | 'error';

export type WideEventDomain = ApiDomain | 'infrastructure' | 'other';

export type WideEventOutcome =
  | 'success'
  | 'client_error'
  | 'server_error'
  | 'aborted';

export type WideEventRateLimitBucket = 'rl:http' | 'rl:ws:msg';

export type WideEventRateLimitStatus =
  | 'pending'
  | 'allowed'
  | 'rejected'
  | 'failed';

export type WideEventLogger = Record<
  WideEventLevel,
  (payload: object, message: string) => void
>;

const wideEventLogShapes = {
  http: { event: 'http_request', message: 'request' },
  ws: {
    message: { event: 'ws_message', message: 'message' },
    connection: { event: 'ws_connection', message: 'connection' },
    disconnection: { event: 'ws_disconnection', message: 'disconnection' },
  },
} as const;

function resolveLogShape(wideEvent: WideEventFinalized) {
  if (wideEvent.transport === 'http') {
    return wideEventLogShapes.http;
  }
  return wideEventLogShapes.ws[wideEvent.kind];
}

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
  return API_DOMAINS.find((domain) => domain === segment) ?? 'other';
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

export function resolveHttpRoute(req: Request): string {
  const route = req.route?.path;
  if (typeof route === 'string' && !route.includes('*')) {
    return route;
  }
  return '<unmatched>';
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
    action: resolveHttpAction(req.method, route),
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
  kind: WsWideEventKind;
  eventName: string;
  socketId: string;
  ip: string | undefined;
  userAgent: string | undefined;
  visitorId: string | undefined;
  client: string | undefined;
  clientVersion: string | undefined;
}): WsWideEventInit {
  if (!isWsWideEventName(params.eventName)) {
    throw new Error(`Unregistered WebSocket event: ${params.eventName}`);
  }
  return {
    transport: 'ws',
    kind: params.kind,
    requestId: nanoid(),
    domain: deriveWsDomain(params.eventName),
    operation: params.eventName,
    action: resolveWsAction(params.eventName),
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
  if (statusCode !== undefined && statusCode >= 500) {
    return 'error';
  }
  if (outcome === 'aborted') {
    return 'warn';
  }
  if (statusCode === undefined) {
    return 'info';
  }
  if (statusCode >= 400) {
    return 'warn';
  }
  return 'info';
}

export function emitWideEventLine(
  logger: WideEventLogger,
  wideEvent: WideEventFinalized,
): void {
  const level = deriveWideEventLevel(wideEvent.statusCode, wideEvent.outcome);
  const { event, message } = resolveLogShape(wideEvent);
  logger[level]({ ...wideEvent, event }, message);
}
