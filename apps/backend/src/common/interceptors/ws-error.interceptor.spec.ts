import { ErrorCode, isApiError } from '@cityborn/api';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
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
  const interceptor = new WsErrorInterceptor();
  const context = {} as ExecutionContext;

  it('passes through the handler result unchanged on success', async () => {
    const next = createCallHandler({ success: true });

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ success: true });
  });

  it('converts a thrown exception into a {success: false, error} ack shaped like ApiError', async () => {
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

  it('produces an error payload that satisfies the shared ApiError schema, exactly like HTTP', async () => {
    const next = createCallHandler(new Error('database down'), true);

    const result = (await lastValueFrom(
      interceptor.intercept(context, next),
    )) as { success: false; error: unknown };

    expect(isApiError(result.error)).toBe(true);
  });

  it('never leaves the ack unresolved: any thrown value resolves to an ack, never a rejection', async () => {
    const next = createCallHandler('a plain string throw', true);

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).resolves.toMatchObject({
      success: false,
      error: { code: ErrorCode.UNKNOWN_ERROR },
    });
  });
});
