jest.mock('nanoid', () => {
  let sequence = 0;
  return { nanoid: jest.fn(() => `test-request-${++sequence}`) };
});

import { setTimeout } from 'node:timers/promises';
import { ErrorCode } from '@cityborn/api';
import {
  type CanActivate,
  Controller,
  type ExecutionContext,
  Get,
  HttpException,
  HttpStatus,
  type INestApplication,
  Injectable,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DefaultExceptionFilter } from '../filters/default-exception.filter';
import { WIDE_EVENT_LOGGER } from './wide-event';
import { WideEventModule } from './wide-event.module';
import { WideEventService } from './wide-event.service';

@Injectable()
class UnauthorizedGuard implements CanActivate {
  canActivate(_context: ExecutionContext): never {
    throw new HttpException(
      { code: ErrorCode.USER_TOKEN_MISSING, message: 'Token missing' },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

@Injectable()
class LimitedGuard implements CanActivate {
  constructor(private readonly wideEventService: WideEventService) {}

  canActivate(_context: ExecutionContext): never {
    this.wideEventService.enrichRateLimit({
      rateLimitBucket: 'rl:http',
      rateLimitRemaining: 0,
      rateLimitStatus: 'rejected',
    });
    throw new HttpException(
      {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

@Controller()
class ProbeController {
  constructor(private readonly wideEventService: WideEventService) {}

  @Get('ok')
  ok() {
    return { hello: 'world' };
  }

  @Get('boom')
  boom(): never {
    throw new Error('kaboom');
  }

  @UseGuards(UnauthorizedGuard)
  @Get('auth/protected')
  protectedRoute(): void {}

  @UseGuards(LimitedGuard)
  @Get('auth/limited')
  limitedRoute(): void {}

  @Get('session/context/:sessionId')
  async context(@Param('sessionId') sessionId: string): Promise<void> {
    this.wideEventService.enrichBusinessContext({ sessionId });
    await setTimeout(sessionId === 'slow' ? 25 : 1);
  }

  @Get('session/abort')
  async abort(): Promise<void> {
    await setTimeout(100);
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
      providers: [UnauthorizedGuard, LimitedGuard],
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

  const requestLines = (spy: jest.Mock): WideEventLine[] =>
    spy.mock.calls
      .map((call) => call[0] as unknown)
      .filter(
        (payload): payload is WideEventLine =>
          typeof payload === 'object' &&
          payload !== null &&
          (payload as WideEventLine).event === 'http_request',
      );

  const allRequestLines = (): WideEventLine[] => [
    ...requestLines(wideEventLogger.info),
    ...requestLines(wideEventLogger.warn),
    ...requestLines(wideEventLogger.error),
  ];

  it('emits one complete event for a successful request', async () => {
    await request(app.getHttpServer()).get('/ok').expect(200);

    expect(allRequestLines()).toHaveLength(1);
    expect(requestLines(wideEventLogger.info)[0]).toMatchObject({
      domain: 'other',
      operation: 'GET /ok',
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

    expect(requestLines(wideEventLogger.info)[0]).toMatchObject({
      client: 'web',
      clientVersion: '1.2.3',
    });
  });

  it('emits one client_error event for a 401 rejected by a guard', async () => {
    await request(app.getHttpServer()).get('/auth/protected').expect(401);

    expect(allRequestLines()).toHaveLength(1);
    expect(requestLines(wideEventLogger.warn)[0]).toMatchObject({
      domain: 'auth',
      operation: 'GET /auth/protected',
      outcome: 'client_error',
      statusCode: 401,
      errorCode: ErrorCode.USER_TOKEN_MISSING,
    });
  });

  it('emits one client_error event for an unmatched route without logging its query', async () => {
    await request(app.getHttpServer()).get('/missing?token=secret').expect(404);

    expect(allRequestLines()).toHaveLength(1);
    expect(requestLines(wideEventLogger.warn)[0]).toMatchObject({
      domain: 'other',
      operation: 'GET <unmatched>',
      route: '<unmatched>',
      outcome: 'client_error',
      statusCode: 404,
    });
  });

  it('emits one enriched client_error event for a 429 rejected by a guard', async () => {
    await request(app.getHttpServer()).get('/auth/limited').expect(429);

    expect(allRequestLines()).toHaveLength(1);
    expect(requestLines(wideEventLogger.warn)[0]).toMatchObject({
      domain: 'auth',
      outcome: 'client_error',
      statusCode: 429,
      errorCode: ErrorCode.RATE_LIMIT_EXCEEDED,
      rateLimitBucket: 'rl:http',
      rateLimitRemaining: 0,
      rateLimitStatus: 'rejected',
    });
  });

  it('emits one error event for a thrown 500, carrying the error folded in', async () => {
    await request(app.getHttpServer()).get('/boom').expect(500);

    expect(allRequestLines()).toHaveLength(1);
    const errorLine = requestLines(wideEventLogger.error)[0];
    expect(errorLine).toMatchObject({
      outcome: 'server_error',
      statusCode: 500,
      errorCode: ErrorCode.UNKNOWN_ERROR,
      errorMessage: 'kaboom',
      requestId: expect.any(String),
    });
    expect(typeof errorLine.errorStack).toBe('string');
  });

  it('keeps concurrent CLS enrichments isolated', async () => {
    await Promise.all([
      request(app.getHttpServer()).get('/session/context/slow').expect(200),
      request(app.getHttpServer()).get('/session/context/fast').expect(200),
    ]);

    const lines = requestLines(wideEventLogger.info);
    expect(lines).toHaveLength(2);
    expect(lines.map((line) => line.sessionId).sort()).toEqual([
      'fast',
      'slow',
    ]);
    expect(new Set(lines.map((line) => line.requestId)).size).toBe(2);
  });

  it('emits one aborted event when the client interrupts the request', async () => {
    await expect(
      request(app.getHttpServer())
        .get('/session/abort')
        .timeout({ deadline: 10 }),
    ).rejects.toBeDefined();
    await setTimeout(20);

    expect(allRequestLines()).toHaveLength(1);
    expect(requestLines(wideEventLogger.warn)[0]).toMatchObject({
      domain: 'session',
      outcome: 'aborted',
    });
  });
});
