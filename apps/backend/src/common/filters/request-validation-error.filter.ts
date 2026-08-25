import { type ApiError, ErrorCode } from '@cityborn/api';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { RequestValidationError } from '@ts-rest/nest';
import type { ZodError } from 'zod';
import { logApiError, sendApiError } from './utils';

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
}

@Catch(RequestValidationError)
export class RequestValidationErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(RequestValidationErrorFilter.name);

  catch(exception: RequestValidationError, host: ArgumentsHost) {
    const zodError =
      exception.pathParams ??
      exception.headers ??
      exception.query ??
      exception.body;

    const payload: ApiError = {
      statusCode: exception.getStatus(),
      code: ErrorCode.BAD_REQUEST,
      message: zodError ? formatZodError(zodError) : 'Invalid request',
    };

    logApiError(this.logger, 'HTTP Error', payload, exception);
    sendApiError(host, payload);
  }
}
