import { type ErrorCode, getApiVersionInfo } from '@cityborn/api';
import type { Request } from 'express';
import { nanoid } from 'nanoid';

export interface WideEventInit {
  requestId: string;
  method: string;
  route: string;
  ip: string | undefined;
  userAgent: string | undefined;
  visitorId: string | undefined;
  apiVersion: number | undefined;
}

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
}

export type WideEvent = WideEventInit & Partial<WideEventEnrichment>;

export type WideEventLevel = 'info' | 'warn' | 'error';

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

function resolveVisitorId(req: Request): string | undefined {
  const rawVisitorId = req.headers['x-visitor-id'];
  return Array.isArray(rawVisitorId) ? rawVisitorId[0] : rawVisitorId;
}

export function createWideEvent(req: Request): WideEventInit {
  return {
    requestId: nanoid(),
    method: req.method,
    route: req.route?.path ?? req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    visitorId: resolveVisitorId(req),
    apiVersion: resolveApiVersion(req),
  };
}

export function deriveWideEventLevel(statusCode: number): WideEventLevel {
  if (statusCode >= 500) {
    return 'error';
  }
  if (statusCode >= 400) {
    return 'warn';
  }
  return 'info';
}
