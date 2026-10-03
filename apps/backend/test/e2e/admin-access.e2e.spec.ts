import {
  type ApiError,
  ApiErrorSchema,
  buildUser,
  contract,
  ErrorCode,
  type User,
} from '@cityborn/api';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { ACCESS_TOKEN_COOKIE_NAME } from '../../src/auth/services/auth-cookie.service';
import { HTTP_CONFIG, type HttpConfig } from '../../src/config/config.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createAccessToken } from '../support/createAccessToken';
import { createTestApp } from '../support/createTestApp';

describe('Admin routes access', () => {
  let app: NestExpressApplication;
  let httpConfig: HttpConfig;

  beforeAll(async () => {
    app = await createTestApp();
    httpConfig = app.get<HttpConfig>(HTTP_CONFIG);
  });

  afterAll(async () => {
    await app?.close();
  });

  async function persistUser(user: User): Promise<void> {
    const prismaService: PrismaService = app.get(PrismaService);
    await prismaService.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        type: user.type,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  }

  it('serves an admin route to an admin account', async () => {
    const admin: User = buildUser({ role: 'admin' });
    await persistUser(admin);
    const accessToken: string = await createAccessToken(app, admin.id);

    await request(app.getHttpServer())
      .get(contract.admin.category.getCategoryTrees.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('forbids an admin route to a player account', async () => {
    const player: User = buildUser({ role: 'player' });
    await persistUser(player);
    const accessToken: string = await createAccessToken(app, player.id);

    const response: request.Response = await request(app.getHttpServer())
      .get(contract.admin.category.getCategoryTrees.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    const apiError: ApiError = ApiErrorSchema.parse(response.body);
    expect(apiError.code).toBe(ErrorCode.USER_NOT_ADMIN);
  });

  it('rejects an anonymous request to an admin route', async () => {
    const response: request.Response = await request(app.getHttpServer())
      .get(contract.admin.category.getCategoryTrees.path)
      .expect(401);

    const apiError: ApiError = ApiErrorSchema.parse(response.body);
    expect(apiError.code).toBe(ErrorCode.USER_TOKEN_MISSING);
  });

  it('serves an admin route to an admin cookie session from the back-office', async () => {
    const admin: User = buildUser({ role: 'admin' });
    await persistUser(admin);
    const accessToken: string = await createAccessToken(app, admin.id);

    await request(app.getHttpServer())
      .get(contract.admin.category.getCategoryTrees.path)
      .set('Origin', httpConfig.backOfficeOrigin)
      .set('Cookie', `${ACCESS_TOKEN_COOKIE_NAME}=${accessToken}`)
      .expect(200);
  });

  it('forbids an admin cookie session sent from another browser origin', async () => {
    const admin: User = buildUser({ role: 'admin' });
    await persistUser(admin);
    const accessToken: string = await createAccessToken(app, admin.id);
    const response: request.Response = await request(app.getHttpServer())
      .get(contract.admin.category.getCategoryTrees.path)
      .set('Origin', 'https://cityborn.test')
      .set('Cookie', `${ACCESS_TOKEN_COOKIE_NAME}=${accessToken}`)
      .expect(403);

    const apiError: ApiError = ApiErrorSchema.parse(response.body);
    expect(apiError.code).toBe(ErrorCode.CSRF_ORIGIN_FORBIDDEN);
  });
});
