import { type ApiError, ErrorCode } from '@cityborn/api';
import {
  type ArgumentsHost,
  BadRequestException,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

function toPartialApiError(value: unknown): Partial<ApiError> | null {
  return value && typeof value === 'object' ? (value as Partial<ApiError>) : null;
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

  private buildPayload(exception: unknown, statusCode: number): ApiError {
    const errorObj =
      exception instanceof HttpException
        ? toPartialApiError(exception.getResponse())
        : exception instanceof WsException
          ? toPartialApiError(exception.getError())
          : null;

    const fallbackCode =
      exception instanceof BadRequestException
        ? ErrorCode.BAD_REQUEST
        : ErrorCode.UNKNOWN_ERROR;

    return {
      statusCode,
      code: errorObj?.code ?? fallbackCode,
      message:
        errorObj?.message ??
        (exception instanceof Error ? exception.message : 'Unexpected error'),
    };
  }

  private logPayload(prefix: string, payload: ApiError, exception: unknown) {
    if (payload.code === ErrorCode.UNKNOWN_ERROR) {
      this.logger.error(
        `${prefix}: ${payload.code} - ${payload.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${prefix}: ${payload.code} - ${payload.message}`);
    }
  }

  private handleHttpContextError(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = this.buildPayload(exception, status);
    this.logPayload('HTTP Error', payload, exception);

    host.switchToHttp().getResponse().status(payload.statusCode).json(payload);
  }

  private handleWsContextError(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = this.buildPayload(exception, status);
    this.logPayload('WS Error', payload, exception);

    host.switchToWs().getClient().emit('error', payload);
  }
}
