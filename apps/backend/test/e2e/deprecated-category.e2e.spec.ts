import {
  type ApiError,
  ApiErrorSchema,
  buildPack,
  contract,
  ErrorCode,
  type Pack,
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
    const pack: Pack = buildPack();
    await app.get(PrismaService).pack.create({
      data: { id: pack.id, name: pack.name, isPublished: pack.isPublished },
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
