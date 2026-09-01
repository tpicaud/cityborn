import { ErrorCode } from '@cityborn/api';
import { type ArgumentsHost, Logger, NotFoundException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { DefaultExceptionFilter } from './default-exception.filter';

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
