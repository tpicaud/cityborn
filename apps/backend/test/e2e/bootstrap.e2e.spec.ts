import {
  API_CURRENT_VERSION_HEADER_NAME,
  API_MIN_SUPPORTED_VERSION_HEADER_NAME,
  buildSession,
  contract,
  ErrorCode,
  getApiVersionInfo,
  SessionSchema,
} from '@cityborn/api';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { RedisService } from '../../src/redis/redis.service';
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
