import {
  ApiErrorSchema,
  buildUser,
  type CatalogSection,
  CatalogSectionMoveDirection,
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

describe('Catalog section admin routes', () => {
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

  it('creates, renames and moves a section to the top of the list', async () => {
    const token: string = await authenticateAdmin();
    await request(app.getHttpServer())
      .post(contract.admin.catalogSection.createCatalogSection.path)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nouveautés' })
      .expect(201);

    const createdResponse: request.Response = await request(app.getHttpServer())
      .post(contract.admin.catalogSection.createCatalogSection.path)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Événements' })
      .expect(201);
    const section: CatalogSection = CatalogSectionSchema.parse(
      createdResponse.body,
    );
    await request(app.getHttpServer())
      .put(
        contract.admin.catalogSection.renameCatalogSection.path.replace(
          ':id',
          section.id,
        ),
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Évènements' })
      .expect(200);
    await request(app.getHttpServer())
      .post(
        contract.admin.catalogSection.moveCatalogSection.path.replace(
          ':id',
          section.id,
        ),
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ direction: CatalogSectionMoveDirection.UP })
      .expect(200);
    const listResponse: request.Response = await request(app.getHttpServer())
      .get(contract.admin.catalogSection.getCatalogSections.path)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(
      CatalogSectionsSchema.parse(listResponse.body).map(({ name }) => name),
    ).toEqual(['Évènements', 'Nouveautés']);
  });

  it('rejects the reserved name through the request validation pipeline', async () => {
    const token: string = await authenticateAdmin();

    const response: request.Response = await request(app.getHttpServer())
      .post(contract.admin.catalogSection.createCatalogSection.path)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: ' tous les packs ' })
      .expect(400);

    expect(ApiErrorSchema.parse(response.body)).toMatchObject({
      code: ErrorCode.BAD_REQUEST,
      fieldErrors: [
        { path: 'name', message: '« Tous les packs » est réservé' },
      ],
    });
  });
});
