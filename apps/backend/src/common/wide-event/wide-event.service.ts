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

interface WideEventState {
  wideEvent: WideEvent;
  startedAt: bigint;
  finalized: boolean;
}

export interface WideEventClsStore extends ClsStore {
  wideEventState: WideEventState;
}

@Injectable()
export class WideEventService {
  constructor(
    private readonly cls: ClsService<WideEventClsStore>,
    @Inject(PinoLogger) private readonly logger: WideEventLogger,
  ) {}

  run<T>(init: WideEventInit, callback: () => T): T {
    const wideEventState: WideEventState = {
      wideEvent: init,
      startedAt: process.hrtime.bigint(),
      finalized: false,
    };
    return this.cls.runWith({ wideEventState }, callback);
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
    const wideEventState: WideEventState | undefined = this.getActiveState();
    if (!wideEventState) {
      return;
    }
    wideEventState.finalized = true;
    const current: WideEvent = wideEventState.wideEvent;
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
        Number(process.hrtime.bigint() - wideEventState.startedAt) / 1e6,
    };
    wideEventState.wideEvent = finalized;
    emitWideEventLine(this.logger, finalized);
  }

  private get(): WideEvent | undefined {
    return this.cls.get('wideEventState')?.wideEvent;
  }

  private getActiveState(): WideEventState | undefined {
    const wideEventState: WideEventState | undefined =
      this.cls.get('wideEventState');
    if (!wideEventState || wideEventState.finalized) {
      return undefined;
    }
    return wideEventState;
  }

  private merge(fields: Partial<WideEventEnrichment>): boolean {
    const wideEventState: WideEventState | undefined = this.getActiveState();
    if (!wideEventState) {
      return false;
    }
    wideEventState.wideEvent = { ...wideEventState.wideEvent, ...fields };
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
