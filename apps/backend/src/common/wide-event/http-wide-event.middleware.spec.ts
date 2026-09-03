import { EventEmitter } from 'node:events';
import type { NextFunction, Request, Response } from 'express';
import { ClsServiceManager } from 'nestjs-cls';
import { HttpWideEventMiddleware } from './http-wide-event.middleware';
import { type WideEventClsStore, WideEventService } from './wide-event.service';

class FakeResponse extends EventEmitter {
  statusCode = 200;
  writableFinished = false;
}

describe('HttpWideEventMiddleware', () => {
  it('emits one aborted event when the connection closes before finish', () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const cls = ClsServiceManager.getClsService<WideEventClsStore>();
    const wideEventService = new WideEventService(cls, logger);
    const middleware = new HttpWideEventMiddleware(wideEventService, cls);
    const request = Object.assign(new EventEmitter(), {
      method: 'GET',
      route: { path: '/slow' },
      headers: {},
    });
    const response = new FakeResponse();

    middleware.use(
      request as unknown as Request,
      response as unknown as Response,
      (() => {
        response.emit('close');
        response.emit('finish');
      }) as NextFunction,
    );

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'http_request',
        outcome: 'aborted',
      }),
      'request',
    );
    expect(logger.info).not.toHaveBeenCalled();
  });
});
