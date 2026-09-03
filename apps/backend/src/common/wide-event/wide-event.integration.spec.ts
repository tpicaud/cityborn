jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'test-request-id') }));

import { ErrorCode } from '@cityborn/api';
import {
  type CanActivate,
  Controller,
  Get,
  type INestApplication,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DefaultExceptionFilter } from '../filters/default-exception.filter';
import { WIDE_EVENT_LOGGER } from './wide-event';
import { WideEventModule } from './wide-event.module';

@Injectable()
class RejectGuard implements CanActivate {
  canActivate(): never {
    throw new UnauthorizedException();
  }
}

@Controller()
class ProbeController {
  @Get('ok')
  ok() {
    return { hello: 'world' };
  }

  @Get('boom')
  boom(): never {
    throw new Error('kaboom');
  }

  @Get('protected')
  @UseGuards(RejectGuard)
  protected() {
    return { hidden: true };
  }
}

type WideEventLine = Record<string, unknown> & { event?: unknown };

describe('wide event integration — one line per request, error folded in', () => {
  let app: INestApplication<App>;
  const wideEventLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot({
          pinoHttp: { autoLogging: false, level: 'silent' },
        }),
        WideEventModule,
      ],
      controllers: [ProbeController],
      providers: [RejectGuard],
    })
      .overrideProvider(WIDE_EVENT_LOGGER)
      .useValue(wideEventLogger)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new DefaultExceptionFilter());
    await app.init();
  });

  beforeEach(() => {
    wideEventLogger.info.mockClear();
    wideEventLogger.warn.mockClear();
    wideEventLogger.error.mockClear();
  });

  afterAll(() => app.close());

  const httpRequestLines = (spy: jest.Mock): WideEventLine[] =>
    spy.mock.calls
      .map((call) => call[0] as unknown)
      .filter(
        (payload): payload is WideEventLine =>
          typeof payload === 'object' &&
          payload !== null &&
          (payload as WideEventLine).event === 'http_request',
      );

  it('emits exactly one info line for a 2xx response', async () => {
    await request(app.getHttpServer()).get('/ok').expect(200);

    expect(httpRequestLines(wideEventLogger.info)).toHaveLength(1);
    expect(httpRequestLines(wideEventLogger.warn)).toHaveLength(0);
    expect(httpRequestLines(wideEventLogger.error)).toHaveLength(0);
    expect(httpRequestLines(wideEventLogger.info)[0]).toMatchObject({
      route: '/ok',
      outcome: 'success',
      statusCode: 200,
    });
  });

  it('folds the calling client identity from the request headers', async () => {
    await request(app.getHttpServer())
      .get('/ok')
      .set('X-Client-Name', 'web')
      .set('X-Client-Version', '1.2.3')
      .expect(200);

    expect(httpRequestLines(wideEventLogger.info)[0]).toMatchObject({
      client: 'web',
      clientVersion: '1.2.3',
    });
  });

  it('emits exactly one error line for a thrown 500, carrying the error folded in', async () => {
    await request(app.getHttpServer()).get('/boom').expect(500);

    const errorLines = httpRequestLines(wideEventLogger.error);

    expect(httpRequestLines(wideEventLogger.info)).toHaveLength(0);
    expect(errorLines).toHaveLength(1);
    expect(errorLines[0]).toMatchObject({
      event: 'http_request',
      statusCode: 500,
      errorCode: ErrorCode.UNKNOWN_ERROR,
      errorMessage: 'kaboom',
      requestId: expect.any(String),
    });
    expect(typeof errorLines[0].errorStack).toBe('string');
    expect(errorLines[0].outcome).toBe('server_error');
  });

  it('emits exactly one line when a guard rejects before interceptors', async () => {
    await request(app.getHttpServer()).get('/protected').expect(401);

    expect(httpRequestLines(wideEventLogger.warn)).toHaveLength(1);
    expect(httpRequestLines(wideEventLogger.warn)[0]).toMatchObject({
      route: '/protected',
      outcome: 'client_error',
      statusCode: 401,
    });
  });

  it('emits exactly one bounded line for an unknown route', async () => {
    await request(app.getHttpServer())
      .get('/missing/private-value?token=secret')
      .expect(404);

    expect(httpRequestLines(wideEventLogger.warn)).toHaveLength(1);
    expect(httpRequestLines(wideEventLogger.warn)[0]).toMatchObject({
      route: '<unmatched>',
      outcome: 'client_error',
      statusCode: 404,
    });
    expect(
      JSON.stringify(httpRequestLines(wideEventLogger.warn)[0]),
    ).not.toContain('private-value');
    expect(
      JSON.stringify(httpRequestLines(wideEventLogger.warn)[0]),
    ).not.toContain('secret');
  });
});
