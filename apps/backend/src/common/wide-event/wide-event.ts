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
  rateLimitBucket: string;
  rateLimitRemaining: number;
  statusCode: number;
  durationMs: number;
  errorCode: ErrorCode;
  errorMessage: string;
  errorStack: string;
  sessionId: string;
  playerId: string;
}

export type WideEvent = WideEventInit & Partial<WideEventEnrichment>;

export type WideEventLevel = 'info' | 'warn' | 'error';

type WideEventLogger = Record<
  WideEventLevel,
  (payload: object, message: string) => void
>;

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
  return {
    transport: 'http',
    requestId: nanoid(),
    method: req.method,
    route: req.route?.path ?? req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    visitorId: firstHeaderValue(req.headers['x-visitor-id']),
    client: firstHeaderValue(req.headers['x-client-name']),
    clientVersion: firstHeaderValue(req.headers['x-client-version']),
    apiVersion: resolveApiVersion(req),
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
  statusCode: number | undefined,
): WideEventLevel {
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
  const level = deriveWideEventLevel(wideEvent.statusCode);
  const { event, message } = wideEventLogShape[wideEvent.transport];
  logger[level]({ ...wideEvent, event }, message);
}
