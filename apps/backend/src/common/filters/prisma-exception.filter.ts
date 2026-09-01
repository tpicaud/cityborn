import { type ApiError, ErrorCode } from '@cityborn/api';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { toWideEventErrorFields } from '../errors/exception-to-api-error';
import { enrichWideEventFromCls } from '../wide-event/wide-event.service';
import { sendApiError } from './utils';

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
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const payload = toApiError(exception);
    enrichWideEventFromCls(toWideEventErrorFields(payload, exception));

    sendApiError(host, payload);
  }
}
