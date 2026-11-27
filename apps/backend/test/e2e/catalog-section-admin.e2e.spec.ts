import {
  ApiErrorSchema,
  buildPack,
  buildTheme,
  buildUser,
  type CatalogSection,
  CatalogSectionMoveDirection,
  CatalogSectionSchema,
  CatalogSectionsSchema,
  contract,
  ErrorCode,
  type Pack,
  type Theme,
  type User,
} from '@cityborn/api';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { defaultCatalogSectionId } from '../../src/catalog-section/default-catalog-section';
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

  async function insertDefaultSection(): Promise<void> {
    await app.get(PrismaService).catalogSection.create({
      data: {
        id: defaultCatalogSectionId,
        name: 'Tous les packs',
        position: 0,
      },
    });
  }

  it('creates, renames and moves a section to the top of the list', async () => {
    const token: string = await authenticateAdmin();
    await insertDefaultSection();

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

    expect(CatalogSectionsSchema.parse(listResponse.body)).toEqual([
      { id: section.id, name: 'Évènements', isDefault: false, packIds: [] },
      {
        id: defaultCatalogSectionId,
        name: 'Tous les packs',
        isDefault: true,
        packIds: [],
      },
    ]);
  });

  async function insertPublishedPacks(packs: Pack[]): Promise<void> {
    const theme: Theme = buildTheme();
    await app.get(PrismaService).theme.create({ data: theme });
    await app.get(PrismaService).pack.createMany({
      data: packs.map((pack) => ({
        id: pack.id,
        name: pack.name,
        isPublished: pack.isPublished,
        image: pack.image,
        themeId: theme.id,
      })),
    });
  }

  async function addPack({
    token,
    section,
    packs: [pack, ...remainingPacks],
  }: {
    token: string;
    section: CatalogSection;
    packs: Pack[];
  }): Promise<void> {
    if (!pack) return;
    await request(app.getHttpServer())
      .put(
        contract.admin.catalogSection.addPackToCatalogSection.path
          .replace(':id', section.id)
          .replace(':packId', pack.id),
      )
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(200);
    await addPack({ token, section, packs: remainingPacks });
  }

  it('shows the player a section with its packs in order of addition', async () => {
    const token: string = await authenticateAdmin();
    await insertDefaultSection();
    const packs: Pack[] = [
      buildPack({
        id: '00000000-0000-4000-8000-000000000072',
        name: 'Fleuves',
      }),
      buildPack({
        id: '00000000-0000-4000-8000-000000000070',
        name: 'Monuments',
      }),
      buildPack({
        id: '00000000-0000-4000-8000-000000000071',
        name: 'Capitales',
      }),
    ];
    await insertPublishedPacks(packs);
    const createdResponse: request.Response = await request(app.getHttpServer())
      .post(contract.admin.catalogSection.createCatalogSection.path)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Événements' })
      .expect(201);
    const section: CatalogSection = CatalogSectionSchema.parse(
      createdResponse.body,
    );

    await addPack({ token, section, packs });

    const response: request.Response = await request(app.getHttpServer())
      .get(contract.catalogSection.getPlayableCatalogSections.path)
      .expect(200);
    expect(CatalogSectionsSchema.parse(response.body)).toEqual([
      {
        id: defaultCatalogSectionId,
        name: 'Tous les packs',
        isDefault: true,
        packIds: [],
      },
      {
        id: section.id,
        name: 'Événements',
        isDefault: false,
        packIds: [
          '00000000-0000-4000-8000-000000000072',
          '00000000-0000-4000-8000-000000000070',
          '00000000-0000-4000-8000-000000000071',
        ],
      },
    ]);
  });

  it('refuses to add an unknown pack', async () => {
    const token: string = await authenticateAdmin();
    const createdResponse: request.Response = await request(app.getHttpServer())
      .post(contract.admin.catalogSection.createCatalogSection.path)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Événements' })
      .expect(201);
    const section: CatalogSection = CatalogSectionSchema.parse(
      createdResponse.body,
    );

    const response: request.Response = await request(app.getHttpServer())
      .put(
        contract.admin.catalogSection.addPackToCatalogSection.path
          .replace(':id', section.id)
          .replace(':packId', buildPack().id),
      )
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(404);

    expect(ApiErrorSchema.parse(response.body)).toMatchObject({
      code: ErrorCode.PACK_NOT_FOUND,
    });
  });

  it('refuses to delete the default section', async () => {
    const token: string = await authenticateAdmin();
    await insertDefaultSection();

    const response: request.Response = await request(app.getHttpServer())
      .delete(
        contract.admin.catalogSection.deleteCatalogSection.path.replace(
          ':id',
          defaultCatalogSectionId,
        ),
      )
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(ApiErrorSchema.parse(response.body)).toMatchObject({
      code: ErrorCode.CATALOG_SECTION_DEFAULT_NOT_DELETABLE,
    });
    await expect(app.get(PrismaService).catalogSection.count()).resolves.toBe(
      1,
    );
  });
});
