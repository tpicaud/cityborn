import { type ApiError, ErrorCode } from '@cityborn/api';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { logApiError } from './all-exceptions.filter';

function toApiError(exception: Prisma.PrismaClientKnownRequestError): ApiError {
  switch (exception.code) {
    case 'P2002':
      return {
        statusCode: 409,
        code: ErrorCode.RESOURCE_ALREADY_EXISTS,
        message: 'Resource already exists',
      };
    case 'P2025':
      return {
        statusCode: 404,
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: 'Resource not found',
      };
    default:
      return {
        statusCode: 500,
        code: ErrorCode.UNKNOWN_ERROR,
        message: exception.message,
      };
  }
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const payload = toApiError(exception);
    logApiError(this.logger, 'HTTP Error', payload, exception);

    host.switchToHttp().getResponse().status(payload.statusCode).json(payload);
  }
}
