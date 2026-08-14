import { type ApiError, ErrorCode } from '@cityborn/api';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { RequestValidationError } from '@ts-rest/nest';
import type { ZodError } from 'zod';

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

    this.logger.warn(`HTTP Error: ${payload.code} - ${payload.message}`);
    host.switchToHttp().getResponse().status(payload.statusCode).json(payload);
  }
}
