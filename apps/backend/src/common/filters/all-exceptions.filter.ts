import { type ApiError, ErrorCode } from '@cityborn/api';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
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

export function logApiError(
  logger: Logger,
  prefix: string,
  payload: ApiError,
  exception: unknown,
) {
  if (payload.code === ErrorCode.UNKNOWN_ERROR) {
    logger.error(
      `${prefix}: ${payload.code} - ${payload.message}`,
      exception instanceof Error ? exception.stack : undefined,
    );
  } else {
    logger.warn(`${prefix}: ${payload.code} - ${payload.message}`);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctxType = host.getType<'http' | 'ws'>();

    if (ctxType === 'http') {
      this.handleHttpContextError(exception, host);
    } else if (ctxType === 'ws') {
      this.handleWsContextError(exception, host);
    } else {
      this.logger.error(`Unknown error context: ${host.getType()}`);
    }
  }

  private handleHttpContextError(exception: unknown, host: ArgumentsHost) {
    const payload = exceptionToApiError(exception);
    logApiError(this.logger, 'HTTP Error', payload, exception);

    host.switchToHttp().getResponse().status(payload.statusCode).json(payload);
  }

  private handleWsContextError(exception: unknown, host: ArgumentsHost) {
    const payload = exceptionToApiError(exception);
    logApiError(this.logger, 'WS Error', payload, exception);

    host.switchToWs().getClient().emit('error', payload);
  }
}
