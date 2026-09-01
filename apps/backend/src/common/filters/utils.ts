import { type ApiError, ErrorCode } from '@cityborn/api';
import type { ArgumentsHost, Logger } from '@nestjs/common';

export function logWsApiError(
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

export function sendApiError(host: ArgumentsHost, payload: ApiError) {
  host.switchToHttp().getResponse().status(payload.statusCode).json(payload);
}
