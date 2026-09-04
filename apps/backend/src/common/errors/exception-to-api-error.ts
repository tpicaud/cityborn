import { type ApiError, ErrorCode } from '@cityborn/api';
import { HttpException, HttpStatus } from '@nestjs/common';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Prisma } from '@prisma/client';
import { RequestValidationError } from '@ts-rest/nest';
import { RateLimiterRes } from 'rate-limiter-flexible';

interface ErrorCause {
  name: string;
  message: string;
  stack?: string;
}

export interface ErrorDiagnostic {
  code: ErrorCode;
  message: string;
  stack?: string;
  causes?: ErrorCause[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isErrorCode(value: unknown): value is ErrorCode {
  return Object.values(ErrorCode).some((errorCode) => errorCode === value);
}

function exceptionToApiError(exception: unknown): ApiError {
  if (exception instanceof TokenExpiredError) {
    return {
      statusCode: 401,
      code: ErrorCode.TOKEN_EXPIRED,
      message: 'Token expired',
    };
  }
  if (exception instanceof JsonWebTokenError) {
    return {
      statusCode: 401,
      code: ErrorCode.USER_INVALID_TOKEN,
      message: 'Invalid token',
    };
  }
  if (exception instanceof RateLimiterRes) {
    return {
      statusCode: 429,
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests',
    };
  }

  if (exception instanceof RequestValidationError) {
    const zodError =
      exception.pathParams ??
      exception.headers ??
      exception.query ??
      exception.body;
    const fieldErrors = zodError?.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return {
      statusCode: exception.getStatus(),
      code: ErrorCode.BAD_REQUEST,
      message:
        fieldErrors
          ?.map((field) => `${field.path}: ${field.message}`)
          .join(', ') ?? 'Invalid request',
      fieldErrors,
    };
  }

  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    if (exception.code === 'P2002') {
      return {
        statusCode: 409,
        code: ErrorCode.RESOURCE_ALREADY_EXISTS,
        message: 'Resource already exists',
      };
    }
    if (exception.code === 'P2025') {
      return {
        statusCode: 404,
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: 'Resource not found',
      };
    }
  }

  if (
    isRecord(exception) &&
    exception.type === 'entity.too.large' &&
    exception.status === 413
  ) {
    return {
      statusCode: 413,
      code: ErrorCode.BAD_REQUEST,
      message: 'Request body too large',
    };
  }

  const response =
    exception instanceof HttpException
      ? exception.getResponse()
      : exception instanceof WsException
        ? exception.getError()
        : undefined;
  const payload = isRecord(response) ? response : undefined;
  const wsStatus = payload?.statusCode;
  const statusCode =
    exception instanceof HttpException
      ? exception.getStatus()
      : exception instanceof WsException &&
          typeof wsStatus === 'number' &&
          Number.isInteger(wsStatus) &&
          wsStatus >= 400 &&
          wsStatus <= 599
        ? wsStatus
        : HttpStatus.INTERNAL_SERVER_ERROR;

  return {
    statusCode,
    code: isErrorCode(payload?.code)
      ? payload.code
      : statusCode === 400
        ? ErrorCode.BAD_REQUEST
        : statusCode === 404
          ? ErrorCode.RESOURCE_NOT_FOUND
          : ErrorCode.UNKNOWN_ERROR,
    message:
      statusCode >= 500
        ? 'Internal server error'
        : typeof payload?.message === 'string'
          ? payload.message
          : exception instanceof Error
            ? exception.message
            : 'Unexpected error',
  };
}

export function normalizeException(exception: unknown): {
  apiError: ApiError;
  diagnostic: ErrorDiagnostic;
} {
  const apiError = exceptionToApiError(exception);
  const diagnostic: ErrorDiagnostic = {
    code: apiError.code,
    message: apiError.message,
  };
  if (apiError.statusCode < 500 && apiError.code !== ErrorCode.UNKNOWN_ERROR) {
    return { apiError, diagnostic };
  }
  if (!(exception instanceof Error)) {
    diagnostic.message =
      typeof exception === 'string' ? exception : apiError.message;
    return { apiError, diagnostic };
  }

  diagnostic.message = exception.message;
  diagnostic.stack = exception.stack;
  const causes: ErrorCause[] = [];
  const seen = new Set<unknown>([exception]);
  let cause: unknown = exception.cause;
  while (cause !== undefined && !seen.has(cause) && causes.length < 10) {
    seen.add(cause);
    if (!(cause instanceof Error)) {
      if (typeof cause === 'string') {
        causes.push({ name: 'Error', message: cause });
      }
      break;
    }
    causes.push({
      name: cause.name,
      message: cause.message,
      stack: cause.stack,
    });
    cause = cause.cause;
  }
  if (causes.length > 0) {
    diagnostic.causes = causes;
  }
  return { apiError, diagnostic };
}
