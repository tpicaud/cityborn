import {
  type ApiError,
  ApiErrorSchema,
  buildPack,
  buildTheme,
  contract,
  ErrorCode,
  type Pack,
  type Theme,
} from '@cityborn/api';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from '../support/createTestApp';

describe('Deprecated category routes', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('serves the same pack trees as the pack route', async () => {
    const prismaService: PrismaService = app.get(PrismaService);
    const theme: Theme = buildTheme();
    await prismaService.theme.create({ data: theme });
    const pack: Pack = buildPack({ themeId: theme.id });
    await prismaService.pack.create({
      data: {
        id: pack.id,
        name: pack.name,
        isPublished: pack.isPublished,
        themeId: pack.themeId,
      },
    });

    const categoryResponse: request.Response = await request(
      app.getHttpServer(),
    )
      .get(contract.category.getCategoryTrees.path)
      .expect(200);
    const packResponse: request.Response = await request(app.getHttpServer())
      .get(contract.pack.getPackTrees.path)
      .expect(200);

    expect(categoryResponse.body).toEqual([
      {
        id: pack.id,
        name: pack.name,
        isPublished: pack.isPublished,
        themeId: theme.id,
        children: [],
      },
    ]);
    expect(categoryResponse.body).toEqual(packResponse.body);
  });

  it('rejects an unknown pack with the category error code', async () => {
    const unknownPack: Pack = buildPack();

    const response: request.Response = await request(app.getHttpServer())
      .get(contract.category.getCategory.path.replace(':id', unknownPack.id))
      .expect(404);

    const apiError: ApiError = ApiErrorSchema.parse(response.body);
    expect(apiError.code).toBe(ErrorCode.CATEGORY_NOT_FOUND);
  });
});
