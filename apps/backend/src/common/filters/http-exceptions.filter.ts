import { ErrorCode } from '@cityborn/errors';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  type HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HTTPExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(HTTPExceptionsFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ErrorCode.UNKNOWN_ERROR;
    let message = 'Unexpected error';

    status = exception.getStatus();
    const res = exception.getResponse() as any;

    code = res.code || ErrorCode.UNKNOWN_ERROR;
    message =
      (typeof res === 'string' ? res : res.message) || 'Unexpected error';

    // Log unkown or internal server errors
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`[${code}] ${exception.message}`, exception.stack);
    } else if (code === ErrorCode.UNKNOWN_ERROR) {
      this.logger.warn(
        `Unknown error (non-500) caught: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
