import { type ApiError, ErrorCode, resolveHttpAction } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { ClsService, type ClsStore } from 'nestjs-cls';
import { PinoLogger } from 'nestjs-pino';
import {
  type ErrorDiagnostic,
  normalizeException,
} from '../errors/exception-to-api-error';
import {
  deriveHttpDomain,
  deriveWideEventLevel,
  deriveWideEventOutcome,
  emitWideEventLine,
  type OperationErrorWideEvent,
  type WideEvent,
  type WideEventAuthContext,
  type WideEventBusinessContext,
  type WideEventEnrichment,
  type WideEventFinalization,
  type WideEventInit,
  type WideEventLogger,
  type WideEventOperationContext,
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
      this.emitOperationError(apiError.statusCode, diagnostic, {
        domain: this.get()?.domain ?? 'other',
        operation: source,
      });
    }
    return apiError;
  }

  recordOperationError(
    exception: unknown,
    context: WideEventOperationContext,
  ): void {
    const { apiError, diagnostic } = normalizeException(exception);

    this.emitOperationError(apiError.statusCode, diagnostic, context);
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
            action: resolveHttpAction(current.method, route),
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
    Object.assign(current, fields);
    this.cls.set('wideEvent', current);
    return true;
  }

  private emitOperationError(
    statusCode: number,
    diagnostic: ErrorDiagnostic,
    context: WideEventOperationContext,
  ): void {
    const level = deriveWideEventLevel(statusCode);
    const requestId = this.get()?.requestId;
    const operationErrorWideEvent = {
      event: 'operation_error',
      ...(requestId ? { requestId } : {}),
      ...context,
      statusCode,
      outcome: deriveWideEventOutcome(statusCode),
      errorCode: diagnostic.code,
      errorMessage: diagnostic.message,
      errorStack: diagnostic.stack,
      errorCauses: diagnostic.causes,
    } satisfies OperationErrorWideEvent;
    this.logger[level](operationErrorWideEvent, 'operation error');
  }
}
