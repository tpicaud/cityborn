import { type ApiError, ErrorCode } from '@cityborn/api';
import { HttpException, HttpStatus } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { WideEventEnrichment } from '../wide-event/wide-event';

function toPartialApiError(value: unknown): Partial<ApiError> | null {
  return value && typeof value === 'object'
    ? (value as Partial<ApiError>)
    : null;
}

export function exceptionToApiError(exception: unknown): ApiError {
  const statusCode =
    exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

  const errorObj =
    exception instanceof HttpException
      ? toPartialApiError(exception.getResponse())
      : exception instanceof WsException
        ? toPartialApiError(exception.getError())
        : null;

  return {
    statusCode,
    code: errorObj?.code ?? ErrorCode.UNKNOWN_ERROR,
    message:
      errorObj?.message ??
      (exception instanceof Error ? exception.message : 'Unexpected error'),
  };
}

const serverErrorStatus = 500;

export function shouldRetainStack(apiError: ApiError): boolean {
  return (
    apiError.statusCode >= serverErrorStatus ||
    apiError.code === ErrorCode.UNKNOWN_ERROR
  );
}

type WideEventErrorFields = Pick<
  WideEventEnrichment,
  'errorCode' | 'errorMessage'
> &
  Partial<Pick<WideEventEnrichment, 'errorStack'>>;

export function toWideEventErrorFields(
  apiError: ApiError,
  exception: unknown,
): WideEventErrorFields {
  const fields: WideEventErrorFields = {
    errorCode: apiError.code,
    errorMessage: apiError.message,
  };

  if (
    shouldRetainStack(apiError) &&
    exception instanceof Error &&
    exception.stack
  ) {
    fields.errorStack = exception.stack;
  }

  return fields;
}
