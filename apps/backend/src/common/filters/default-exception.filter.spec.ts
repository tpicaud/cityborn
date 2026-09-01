import { ErrorCode } from '@cityborn/api';
import { type ArgumentsHost, Logger, NotFoundException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ClsServiceManager } from 'nestjs-cls';
import type { WideEvent, WideEventInit } from '../wide-event/wide-event';
import type { WideEventClsStore } from '../wide-event/wide-event.service';
import { DefaultExceptionFilter } from './default-exception.filter';

const baseWideEvent: WideEventInit = {
  requestId: 'rid',
  method: 'GET',
  route: '/x',
  ip: undefined,
  userAgent: undefined,
  visitorId: undefined,
  apiVersion: 7,
};

function catchInCls(
  filter: DefaultExceptionFilter,
  exception: unknown,
  host: ArgumentsHost,
): WideEvent | undefined {
  const cls = ClsServiceManager.getClsService<WideEventClsStore>();
  return cls.run(() => {
    cls.set('wideEvent', { ...baseWideEvent });
    filter.catch(exception, host);
    return cls.get('wideEvent');
  });
}

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

  it('enriches the wide event with errorCode/errorMessage for a known 4xx code, without a stack', () => {
    const filter = new DefaultExceptionFilter();
    const { host } = createHttpHost();
    const exception = new NotFoundException({
      code: ErrorCode.SESSION_NOT_FOUND,
      message: 'Session not found',
    });

    const wideEvent = catchInCls(filter, exception, host);

    expect(wideEvent).toMatchObject({
      errorCode: ErrorCode.SESSION_NOT_FOUND,
      errorMessage: 'Session not found',
    });
    expect(wideEvent?.errorStack).toBeUndefined();
  });

  it('enriches the wide event with a stack for an UNKNOWN_ERROR (5xx)', () => {
    const filter = new DefaultExceptionFilter();
    const { host } = createHttpHost();
    const exception = new Error('database down');

    const wideEvent = catchInCls(filter, exception, host);

    expect(wideEvent).toMatchObject({
      errorCode: ErrorCode.UNKNOWN_ERROR,
      errorMessage: 'database down',
    });
    expect(typeof wideEvent?.errorStack).toBe('string');
  });

  it('does not log a line on the HTTP path (the wide event carries the error)', () => {
    const filter = new DefaultExceptionFilter();
    const { host } = createHttpHost();

    catchInCls(
      filter,
      new NotFoundException({
        code: ErrorCode.SESSION_NOT_FOUND,
        message: 'Session not found',
      }),
      host,
    );
    catchInCls(filter, new Error('database down'), host);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('neither writes a response nor emits, and logs, for an unrecognized execution context', () => {
    const filter = new DefaultExceptionFilter();
    const { host } = createUnknownHost('rpc');

    expect(() => filter.catch(new Error('n/a'), host)).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith('Unknown error context: rpc');
  });
});
