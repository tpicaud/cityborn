import { ErrorCode } from '@cityborn/api';
import {
  type ArgumentsHost,
  Controller,
  Get,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RequestValidationError } from '@ts-rest/nest';
import { ClsServiceManager } from 'nestjs-cls';
import request from 'supertest';
import type { App } from 'supertest/types';
import { z } from 'zod';
import type { HttpWideEventInit, WideEvent } from '../wide-event/wide-event';
import type { WideEventClsStore } from '../wide-event/wide-event.service';
import { DefaultExceptionFilter } from './default-exception.filter';
import { RequestValidationErrorFilter } from './request-validation-error.filter';

@Controller()
class ThrowingController {
  @Get('boom')
  boom() {
    const bodyResult = z.object({ foo: z.string() }).safeParse({});
    throw new RequestValidationError(
      null,
      null,
      null,
      bodyResult.success ? null : bodyResult.error,
    );
  }
}

describe('RequestValidationErrorFilter registration order', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ThrowingController],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(
      new DefaultExceptionFilter(),
      new RequestValidationErrorFilter(),
    );
    await app.init();
  });

  afterAll(() => app.close());

  it('formats a ts-rest validation error as a BAD_REQUEST ApiError', async () => {
    const response = await request(app.getHttpServer()).get('/boom');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: ErrorCode.BAD_REQUEST,
      statusCode: 400,
    });
    expect(response.body.message).toContain('foo');
    expect(response.body.fieldErrors).toEqual([
      { path: 'foo', message: expect.any(String) },
    ]);
  });
});

describe('RequestValidationErrorFilter wide event enrichment', () => {
  const baseWideEvent: HttpWideEventInit = {
    transport: 'http',
    requestId: 'rid',
    method: 'GET',
    route: '/x',
    ip: undefined,
    userAgent: undefined,
    visitorId: undefined,
    client: undefined,
    clientVersion: undefined,
    apiVersion: 7,
    isAuthenticated: false,
  };

  const httpHost = {
    getType: () => 'http',
    switchToHttp: () => ({
      getResponse: () => ({ status: () => ({ json: () => undefined }) }),
    }),
  } as unknown as ArgumentsHost;

  it('carries BAD_REQUEST and the formatted message, never a stack', () => {
    const bodyResult = z.object({ foo: z.string() }).safeParse({});
    const exception = new RequestValidationError(
      null,
      null,
      null,
      bodyResult.success ? null : bodyResult.error,
    );

    const cls = ClsServiceManager.getClsService<WideEventClsStore>();
    const wideEvent = cls.run<WideEvent | undefined>(() => {
      cls.set('wideEvent', { ...baseWideEvent });
      new RequestValidationErrorFilter().catch(exception, httpHost);
      return cls.get('wideEvent');
    });

    expect(wideEvent?.errorCode).toBe(ErrorCode.BAD_REQUEST);
    expect(wideEvent?.errorMessage).toContain('foo');
    expect(wideEvent?.errorStack).toBeUndefined();
  });
});
