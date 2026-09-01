import { type ApiError, ErrorCode } from '@cityborn/api';
import { HttpException, HttpStatus } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

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
