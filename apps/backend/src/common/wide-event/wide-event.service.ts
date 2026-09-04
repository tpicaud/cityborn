import { type ApiError, ErrorCode } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { ClsService, type ClsStore } from 'nestjs-cls';
import { PinoLogger } from 'nestjs-pino';
import { normalizeException } from '../errors/exception-to-api-error';
import {
  deriveHttpDomain,
  deriveWideEventLevel,
  deriveWideEventOutcome,
  emitWideEventLine,
  type WideEvent,
  type WideEventAuthContext,
  type WideEventBusinessContext,
  type WideEventEnrichment,
  type WideEventFinalization,
  type WideEventInit,
  type WideEventLogger,
  type WideEventRateLimitContext,
} from './wide-event';

export interface WideEventClsStore extends ClsStore {
  wideEvent: WideEvent;
  startedAt: bigint;
  finalized: boolean;
}

@Injectable()
export class WideEventService {
  constructor(
    private readonly cls: ClsService<WideEventClsStore>,
    @Inject(PinoLogger) private readonly logger: WideEventLogger,
  ) {}

  run<T>(init: WideEventInit, callback: () => T): T {
    return this.cls.runWith(
      { wideEvent: init, startedAt: process.hrtime.bigint(), finalized: false },
      callback,
    );
  }

  enrichAuth(fields: WideEventAuthContext): void {
    this.merge({ userId: undefined, ...fields });
  }

  enrichBusinessContext(fields: WideEventBusinessContext): void {
    this.merge(fields);
  }

  enrichRateLimit(fields: WideEventRateLimitContext): void {
    this.merge({ rateLimitRemaining: undefined, ...fields });
  }

  recordError(exception: unknown, source = 'operation'): ApiError {
    const { apiError, diagnostic } = normalizeException(exception);
    if (this.get()?.rateLimitStatus === 'pending') {
      this.merge(
        apiError.code === ErrorCode.RATE_LIMIT_EXCEEDED
          ? { rateLimitStatus: 'rejected', rateLimitRemaining: 0 }
          : { rateLimitStatus: 'failed' },
      );
    }
    if (
      !this.merge({
        statusCode: apiError.statusCode,
        errorCode: diagnostic.code,
        errorMessage: diagnostic.message,
        errorStack: diagnostic.stack,
        errorCauses: diagnostic.causes,
      })
    ) {
      const level = deriveWideEventLevel(apiError.statusCode);
      this.logger[level](
        {
          event: 'operation_error',
          source,
          statusCode: apiError.statusCode,
          ...diagnostic,
        },
        'operation error',
      );
    }
    return apiError;
  }

  finish(fields: WideEventFinalization = {}): void {
    const current = this.get();
    if (!current || this.cls.get('finalized')) {
      return;
    }
    this.cls.set('finalized', true);
    const statusCode = fields.statusCode ?? current.statusCode ?? 200;
    const route = fields.route;
    const finalized = {
      ...current,
      ...(current.transport === 'http' && route !== undefined
        ? {
            route,
            domain: deriveHttpDomain(route),
            operation: `${current.method} ${route}`,
          }
        : {}),
      statusCode,
      outcome: deriveWideEventOutcome(statusCode, fields.aborted),
      durationMs:
        Number(process.hrtime.bigint() - this.cls.get('startedAt')) / 1e6,
    };
    this.cls.set('wideEvent', finalized);
    emitWideEventLine(this.logger, finalized);
  }

  private get(): WideEvent | undefined {
    return this.cls.get('wideEvent');
  }

  private merge(fields: Partial<WideEventEnrichment>): boolean {
    const current = this.get();
    if (!current || this.cls.get('finalized')) {
      return false;
    }
    this.cls.set('wideEvent', { ...current, ...fields });
    return true;
  }
}
