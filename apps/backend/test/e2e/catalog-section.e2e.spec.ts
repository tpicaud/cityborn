import {
  ApiErrorSchema,
  buildUser,
  type CatalogSection,
  CatalogSectionSchema,
  CatalogSectionsSchema,
  contract,
  ErrorCode,
  type User,
} from '@cityborn/api';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createAccessToken } from '../support/createAccessToken';
import { createTestApp } from '../support/createTestApp';

describe('Catalog section routes', () => {
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
  it('creates a section through the admin contract and hides it publicly while empty', async () => {
    const token: string = await authenticateAdmin();

    const response: request.Response = await request(app.getHttpServer())
      .post(contract.admin.catalogSection.createSection.path)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '  Nouveautés  ', themeId: null })
      .expect(201);
    const section: CatalogSection = CatalogSectionSchema.parse(response.body);
    const published: request.Response = await request(app.getHttpServer())
      .get(contract.catalogSection.getPublishedSections.path)
      .expect(200);
    const admin: request.Response = await request(app.getHttpServer())
      .get(contract.admin.catalogSection.getSections.path)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(section.name).toBe('Nouveautés');
    expect(CatalogSectionsSchema.parse(published.body)).toEqual([]);
    expect(CatalogSectionsSchema.parse(admin.body)).toEqual([section]);
  });
  it('rejects reserved names through request validation with a displayable error', async () => {
    const token: string = await authenticateAdmin();

    const response: request.Response = await request(app.getHttpServer())
      .post(contract.admin.catalogSection.createSection.path)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: ' TOUS LES PACKS ', themeId: null })
      .expect(400);

    expect(ApiErrorSchema.parse(response.body)).toMatchObject({
      code: ErrorCode.BAD_REQUEST,
      fieldErrors: [
        { path: 'name', message: 'Le nom « Tous les packs » est réservé' },
      ],
    });
  });
  it('protects section administration from unauthenticated requests', async () => {
    await request(app.getHttpServer())
      .get(contract.admin.catalogSection.getSections.path)
      .expect(401);
  });
});
