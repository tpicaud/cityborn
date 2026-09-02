import { ErrorCode, isApiError } from '@cityborn/api';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import type { WideEventService } from '../wide-event/wide-event.service';
import { WsErrorInterceptor } from './ws-error.interceptor';

function createCallHandler(
  observableOrError: unknown,
  isError = false,
): CallHandler {
  return {
    handle: () =>
      isError ? throwError(() => observableOrError) : of(observableOrError),
  };
}

describe('WsErrorInterceptor', () => {
  const context = {} as ExecutionContext;

  const build = () => {
    const enrich = jest.fn();
    const interceptor = new WsErrorInterceptor({
      enrich,
    } as unknown as WideEventService);
    return { interceptor, enrich };
  };

  it('passes through the handler result unchanged on success', async () => {
    const { interceptor, enrich } = build();
    const next = createCallHandler({ success: true });

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ success: true });
    expect(enrich).not.toHaveBeenCalled();
  });

  it('converts a thrown exception into a {success: false, error} ack shaped like ApiError', async () => {
    const { interceptor } = build();
    const exception = new NotFoundException({
      code: ErrorCode.SESSION_NOT_FOUND,
      message: 'Session not found',
    });
    const next = createCallHandler(exception, true);

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({
      success: false,
      error: {
        statusCode: 404,
        code: ErrorCode.SESSION_NOT_FOUND,
        message: 'Session not found',
      },
    });
  });

  it('folds the error into the wide event instead of logging it separately', async () => {
    const { interceptor, enrich } = build();
    const next = createCallHandler(new Error('database down'), true);

    await lastValueFrom(interceptor.intercept(context, next));

    expect(enrich).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        errorCode: ErrorCode.UNKNOWN_ERROR,
        errorMessage: 'database down',
        errorStack: expect.any(String),
      }),
    );
  });

  it('enriches without a stack for a mapped 4xx code', async () => {
    const { interceptor, enrich } = build();
    const exception = new NotFoundException({
      code: ErrorCode.SESSION_NOT_FOUND,
      message: 'Session not found',
    });
    const next = createCallHandler(exception, true);

    await lastValueFrom(interceptor.intercept(context, next));

    expect(enrich).toHaveBeenCalledWith({
      statusCode: 404,
      errorCode: ErrorCode.SESSION_NOT_FOUND,
      errorMessage: 'Session not found',
    });
  });

  it('produces an error payload that satisfies the shared ApiError schema, exactly like HTTP', async () => {
    const { interceptor } = build();
    const next = createCallHandler(new Error('database down'), true);

    const result = (await lastValueFrom(
      interceptor.intercept(context, next),
    )) as { success: false; error: unknown };

    expect(isApiError(result.error)).toBe(true);
  });

  it('never leaves the ack unresolved: any thrown value resolves to an ack, never a rejection', async () => {
    const { interceptor } = build();
    const next = createCallHandler('a plain string throw', true);

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).resolves.toMatchObject({
      success: false,
      error: { code: ErrorCode.UNKNOWN_ERROR },
    });
  });
});
