import { type ErrorCode, getApiVersionInfo } from '@cityborn/api';
import type { Request } from 'express';
import { nanoid } from 'nanoid';

interface WideEventInitBase {
  requestId: string;
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
  route: string;
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

  return {
    transport: 'http',
    requestId: nanoid(),
    method: req.method,
    route: typeof route === 'string' ? route : '<unresolved>',
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
