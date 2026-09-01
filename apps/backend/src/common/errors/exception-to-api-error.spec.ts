import { ErrorCode } from '@cityborn/api';
import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { exceptionToApiError } from './exception-to-api-error';

describe('exceptionToApiError', () => {
  it('passes through code/message/statusCode from a well-formed HttpException', () => {
    const exception = new NotFoundException({
      code: ErrorCode.SESSION_NOT_FOUND,
      message: 'Session not found',
    });

    expect(exceptionToApiError(exception)).toEqual({
      statusCode: 404,
      code: ErrorCode.SESSION_NOT_FOUND,
      message: 'Session not found',
    });
  });

  it('falls back to UNKNOWN_ERROR but keeps the response message when the body has no code', () => {
    const exception = new BadRequestException('Payload malformed');

    const result = exceptionToApiError(exception);

    expect(result.statusCode).toBe(400);
    expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(result.message).toBe('Payload malformed');
  });

  it('falls back to UNKNOWN_ERROR and exception.message for a default (no-args) HttpException subclass', () => {
    const exception = new BadRequestException();

    const result = exceptionToApiError(exception);

    expect(result.statusCode).toBe(400);
    expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(result.message).toBe(exception.message);
  });

  it('falls back to UNKNOWN_ERROR and exception.message for a raw HttpException with a string body', () => {
    const exception = new HttpException('Teapot', 418);

    const result = exceptionToApiError(exception);

    expect(result.statusCode).toBe(418);
    expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(result.message).toBe('Teapot');
  });

  it('passes through code/message from a well-formed WsException', () => {
    const exception = new WsException({
      code: ErrorCode.SESSION_FORBIDDEN_HOST,
      message: 'Not the host',
    });

    const result = exceptionToApiError(exception);

    expect(result.statusCode).toBe(500);
    expect(result.code).toBe(ErrorCode.SESSION_FORBIDDEN_HOST);
    expect(result.message).toBe('Not the host');
  });

  it('falls back to UNKNOWN_ERROR for a WsException built from a plain string', () => {
    const exception = new WsException('nope');

    const result = exceptionToApiError(exception);

    expect(result.statusCode).toBe(500);
    expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(result.message).toBe('nope');
  });

  it('falls back to UNKNOWN_ERROR and the raw message for a plain Error', () => {
    const exception = new Error('database down');

    expect(exceptionToApiError(exception)).toEqual({
      statusCode: 500,
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'database down',
    });
  });

  it('falls back to UNKNOWN_ERROR and a generic message for a thrown non-Error string', () => {
    expect(exceptionToApiError('boom')).toEqual({
      statusCode: 500,
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'Unexpected error',
    });
  });

  it('falls back to UNKNOWN_ERROR and a generic message for a thrown plain object', () => {
    expect(exceptionToApiError({ foo: 'bar' })).toEqual({
      statusCode: 500,
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'Unexpected error',
    });
  });

  it('falls back to UNKNOWN_ERROR and a generic message for undefined/null', () => {
    expect(exceptionToApiError(undefined)).toEqual({
      statusCode: 500,
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'Unexpected error',
    });
    expect(exceptionToApiError(null)).toEqual({
      statusCode: 500,
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'Unexpected error',
    });
  });
});
