import { ErrorCode } from '@cityborn/api';
import {
  type ArgumentsHost,
  BadRequestException,
  HttpException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import {
  DefaultExceptionFilter,
  exceptionToApiError,
} from './default-exception.filter';

function createHttpHost() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const response = { status };
  const host = {
    getType: () => 'http',
    switchToHttp: () => ({ getResponse: () => response }),
    switchToWs: () => {
      throw new Error('switchToWs should not be called in HTTP context');
    },
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

function createWsHost() {
  const emit = jest.fn();
  const client = { emit };
  const host = {
    getType: () => 'ws',
    switchToWs: () => ({ getClient: () => client }),
    switchToHttp: () => {
      throw new Error('switchToHttp should not be called in WS context');
    },
  } as unknown as ArgumentsHost;
  return { host, emit };
}

function createUnknownHost(type: string) {
  const host = {
    getType: () => type,
    switchToHttp: () => {
      throw new Error('switchToHttp should not be called for unknown context');
    },
    switchToWs: () => {
      throw new Error('switchToWs should not be called for unknown context');
    },
  } as unknown as ArgumentsHost;
  return { host };
}

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

describe('DefaultExceptionFilter', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('writes the ApiError payload to the HTTP response with the right status', () => {
    const filter = new DefaultExceptionFilter();
    const { host, status, json } = createHttpHost();
    const exception = new NotFoundException({
      code: ErrorCode.SESSION_NOT_FOUND,
      message: 'Session not found',
    });

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      code: ErrorCode.SESSION_NOT_FOUND,
      message: 'Session not found',
    });
  });

  it('emits an "error" event with the ApiError payload in WS context', () => {
    const filter = new DefaultExceptionFilter();
    const { host, emit } = createWsHost();
    const exception = new WsException({
      code: ErrorCode.SESSION_FORBIDDEN_HOST,
      message: 'Not the host',
    });

    filter.catch(exception, host);

    expect(emit).toHaveBeenCalledWith('error', {
      statusCode: 500,
      code: ErrorCode.SESSION_FORBIDDEN_HOST,
      message: 'Not the host',
    });
  });

  it('logs a warning (not an error) for a known, non-UNKNOWN_ERROR code', () => {
    const filter = new DefaultExceptionFilter();
    const { host } = createHttpHost();
    const exception = new NotFoundException({
      code: ErrorCode.SESSION_NOT_FOUND,
      message: 'Session not found',
    });

    filter.catch(exception, host);

    expect(warnSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('logs an error (not a warning) for an UNKNOWN_ERROR code', () => {
    const filter = new DefaultExceptionFilter();
    const { host } = createHttpHost();
    const exception = new Error('database down');

    filter.catch(exception, host);

    expect(errorSpy).toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('neither writes a response nor emits, and logs, for an unrecognized execution context', () => {
    const filter = new DefaultExceptionFilter();
    const { host } = createUnknownHost('rpc');

    expect(() => filter.catch(new Error('n/a'), host)).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith('Unknown error context: rpc');
  });
});
