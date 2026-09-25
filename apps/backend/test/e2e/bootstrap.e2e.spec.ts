import {
  API_CURRENT_VERSION_HEADER_NAME,
  API_MIN_SUPPORTED_VERSION_HEADER_NAME,
  buildSession,
  buildUser,
  contract,
  ErrorCode,
  getApiVersionInfo,
  SessionSchema,
  type User,
} from '@cityborn/api';
import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { PinoLogger } from 'nestjs-pino';
import { RateLimiterRes } from 'rate-limiter-flexible';
import request from 'supertest';
import { AUTH_CONFIG, type AuthConfig } from '../../src/config/config.module';
import { RateLimitService } from '../../src/rate-limit/rate-limit.service';
import { RedisService } from '../../src/redis/redis.service';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../src/user/repositories/user.repository';
import { createTestApp } from '../support/createTestApp';

describe('Production bootstrap', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('serves ts-rest routes with the API version headers and CORS configuration', async () => {
    const origin =
      process.env.CORS_ORIGIN?.split(',')[0] ?? 'http://localhost:3000';
    const version = getApiVersionInfo();
    await request(app.getHttpServer())
      .get(contract.health.check.path)
      .set('Origin', origin)
      .expect(200)
      .expect(API_CURRENT_VERSION_HEADER_NAME, String(version.currentVersion))
      .expect(
        API_MIN_SUPPORTED_VERSION_HEADER_NAME,
        String(version.minSupportedVersion),
      )
      .expect('Access-Control-Allow-Origin', origin)
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect({});
  });

  it('reads a session from Redis through the real controller and service', async () => {
    const session = buildSession();
    await app.get(RedisService).setJSON(`session:${session.id}`, session);
    const response = await request(app.getHttpServer())
      .get(contract.session.getSession.path.replace(':id', session.id))
      .expect(200);
    expect(SessionSchema.parse(response.body)).toEqual(
      SessionSchema.parse(session),
    );
  });

  it('serializes ts-rest validation failures with the global exception filter', async () => {
    const response = await request(app.getHttpServer())
      .post(contract.session.createSession.path)
      .send({ mode: 'invalid' })
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: ErrorCode.BAD_REQUEST,
      fieldErrors: [{ path: 'mode', message: expect.any(String) }],
    });
  });

  it('logs the contract action when an authentication guard rejects a route', async () => {
    const warn = jest
      .spyOn(PinoLogger.prototype, 'warn')
      .mockImplementation(() => undefined);

    try {
      await request(app.getHttpServer()).get(contract.auth.me.path).expect(401);

      expect(warn).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'http_request',
          route: '/auth/me',
          action: 'auth.me',
          statusCode: 401,
        }),
        'request',
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('logs the user resolved by the authentication guard', async () => {
    const userRepository: UserRepository = app.get(USER_REPOSITORY);
    const authConfig: AuthConfig = app.get(AUTH_CONFIG);
    const userData: User = buildUser();
    const user: User = await userRepository.create({
      email: userData.email,
      username: userData.username,
      type: userData.type,
    });
    const accessToken: string = await app
      .get(JwtService)
      .signAsync({ id: user.id }, { secret: authConfig.jwtAccessSecret });
    const info = jest
      .spyOn(PinoLogger.prototype, 'info')
      .mockImplementation(() => undefined);

    try {
      await request(app.getHttpServer())
        .get(contract.auth.me.path)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'http_request',
          action: 'auth.me',
          statusCode: 200,
          isAuthenticated: true,
          userId: user.id,
        }),
        'request',
      );
    } finally {
      info.mockRestore();
    }
  });

  it('logs the contract action when the rate limit guard rejects a route', async () => {
    const rateLimitService: RateLimitService = app.get(RateLimitService);
    const consumeHttp = jest
      .spyOn(rateLimitService, 'consumeHttp')
      .mockRejectedValueOnce(new RateLimiterRes(0, 1000, 101, false));
    const warn = jest
      .spyOn(PinoLogger.prototype, 'warn')
      .mockImplementation(() => undefined);

    try {
      await request(app.getHttpServer())
        .get(contract.health.check.path)
        .expect(429);

      expect(warn).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'http_request',
          route: '/health',
          action: 'health.check',
          statusCode: 429,
        }),
        'request',
      );
    } finally {
      consumeHttp.mockRestore();
      warn.mockRestore();
    }
  });

  it('serializes service exceptions with the global exception filter', async () => {
    const response = await request(app.getHttpServer())
      .get(contract.session.getSession.path.replace(':id', 'missing'))
      .expect(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      code: ErrorCode.SESSION_NOT_FOUND,
    });
  });
});
