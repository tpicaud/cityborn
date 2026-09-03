import { ErrorCode } from '@cityborn/api';
import {
  type ArgumentsHost,
  Controller,
  Get,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ClsServiceManager } from 'nestjs-cls';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { HttpWideEventInit, WideEvent } from '../wide-event/wide-event';
import type { WideEventClsStore } from '../wide-event/wide-event.service';
import { DefaultExceptionFilter } from './default-exception.filter';
import { PrismaExceptionFilter } from './prisma-exception.filter';

@Controller()
class ThrowingController {
  @Get('conflict')
  conflict() {
    throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '7.8.0',
    });
  }

  @Get('missing')
  missing() {
    throw new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.8.0',
    });
  }

  @Get('other')
  other() {
    throw new Prisma.PrismaClientKnownRequestError(
      'Foreign key constraint failed',
      { code: 'P2003', clientVersion: '7.8.0' },
    );
  }
}

describe('PrismaExceptionFilter registration order', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ThrowingController],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(
      new DefaultExceptionFilter(),
      new PrismaExceptionFilter(),
    );
    await app.init();
  });

  afterAll(() => app.close());

  it('maps P2002 to 409 RESOURCE_ALREADY_EXISTS', async () => {
    const response = await request(app.getHttpServer()).get('/conflict');

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      statusCode: 409,
      code: ErrorCode.RESOURCE_ALREADY_EXISTS,
    });
  });

  it('maps P2025 to 404 RESOURCE_NOT_FOUND', async () => {
    const response = await request(app.getHttpServer()).get('/missing');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      code: ErrorCode.RESOURCE_NOT_FOUND,
    });
  });

  it('falls back to 500 UNKNOWN_ERROR for an unmapped Prisma code', async () => {
    const response = await request(app.getHttpServer()).get('/other');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      statusCode: 500,
      code: ErrorCode.UNKNOWN_ERROR,
    });
  });
});

describe('PrismaExceptionFilter wide event enrichment', () => {
  const baseWideEvent: HttpWideEventInit = {
    transport: 'http',
    requestId: 'rid',
    method: 'GET',
    route: '/x',
    domain: 'system',
    operation: 'unmapped_request',
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

  const catchInCls = (
    exception: Prisma.PrismaClientKnownRequestError,
  ): WideEvent | undefined => {
    const cls = ClsServiceManager.getClsService<WideEventClsStore>();
    return cls.run(() => {
      cls.set('wideEvent', { ...baseWideEvent });
      new PrismaExceptionFilter().catch(exception, httpHost);
      return cls.get('wideEvent');
    });
  };

  it('carries the mapped errorCode without a stack for a mapped 4xx code', () => {
    const wideEvent = catchInCls(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '7.8.0',
      }),
    );

    expect(wideEvent).toMatchObject({
      errorCode: ErrorCode.RESOURCE_NOT_FOUND,
    });
    expect(wideEvent?.errorStack).toBeUndefined();
  });

  it('carries a stack for an unmapped Prisma code (500 UNKNOWN_ERROR)', () => {
    const wideEvent = catchInCls(
      new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '7.8.0',
        },
      ),
    );

    expect(wideEvent?.errorCode).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(typeof wideEvent?.errorStack).toBe('string');
  });
});
