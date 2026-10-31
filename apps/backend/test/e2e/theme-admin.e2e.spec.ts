import {
  ApiErrorSchema,
  buildUser,
  contract,
  ErrorCode,
  type Theme,
  ThemeIcon,
  ThemeSchema,
  type User,
} from '@cityborn/api';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createAccessToken } from '../support/createAccessToken';
import { createTestApp } from '../support/createTestApp';

describe('Theme admin routes', () => {
  let app: NestExpressApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app?.close();
  });
  async function authenticateAdmin(): Promise<string> {
    const user: User = buildUser({ role: 'admin' });
    await app.get(PrismaService).user.create({ data: user });
    return createAccessToken(app, user.id);
  }
  it('creates, renames and deletes a theme through the admin contract', async () => {
    const token: string = await authenticateAdmin();

    const createdResponse: request.Response = await request(app.getHttpServer())
      .post(contract.admin.theme.createTheme.path)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '  Cinéma  ' })
      .expect(201);
    const theme: Theme = ThemeSchema.parse(createdResponse.body);
    const renamedResponse: request.Response = await request(app.getHttpServer())
      .put(contract.admin.theme.updateTheme.path.replace(':id', theme.id))
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Films' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(contract.admin.theme.deleteTheme.path.replace(':id', theme.id))
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(200, {});

    expect(theme.name).toBe('Cinéma');
    expect(ThemeSchema.parse(renamedResponse.body)).toEqual({
      id: theme.id,
      name: 'Films',
      icon: ThemeIcon.EDUCATION,
    });
    await expect(
      app.get(PrismaService).theme.findUnique({ where: { id: theme.id } }),
    ).resolves.toBeNull();
  });
  it('rejects invalid names through the request validation pipeline', async () => {
    const token: string = await authenticateAdmin();

    const response: request.Response = await request(app.getHttpServer())
      .post(contract.admin.theme.createTheme.path)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '  ' })
      .expect(400);

    expect(ApiErrorSchema.parse(response.body)).toMatchObject({
      code: ErrorCode.BAD_REQUEST,
      fieldErrors: [{ path: 'name', message: 'Le nom est obligatoire' }],
    });
  });
});
