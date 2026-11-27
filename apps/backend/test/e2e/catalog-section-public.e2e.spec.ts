import {
  buildUser,
  CatalogSectionsSchema,
  contract,
  type User,
} from '@cityborn/api';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { defaultCatalogSectionId } from '../../src/catalog-section/default-catalog-section';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createAccessToken } from '../support/createAccessToken';
import { createTestApp } from '../support/createTestApp';

describe('Catalog section player routes', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('names the default section as renamed by an admin', async () => {
    const admin: User = buildUser({ role: 'admin' });
    await app.get(PrismaService).user.create({ data: admin });
    await app.get(PrismaService).catalogSection.create({
      data: {
        id: defaultCatalogSectionId,
        name: 'Tous les packs',
        position: 0,
      },
    });
    await request(app.getHttpServer())
      .put(
        contract.admin.catalogSection.renameCatalogSection.path.replace(
          ':id',
          defaultCatalogSectionId,
        ),
      )
      .set('Authorization', `Bearer ${await createAccessToken(app, admin.id)}`)
      .send({ name: 'Catalogue' })
      .expect(200);

    const response: request.Response = await request(app.getHttpServer())
      .get(contract.catalogSection.getPlayableCatalogSections.path)
      .expect(200);

    expect(CatalogSectionsSchema.parse(response.body)).toEqual([
      {
        id: defaultCatalogSectionId,
        name: 'Catalogue',
        isDefault: true,
        themeId: null,
        packIds: [],
      },
    ]);
  });
});
