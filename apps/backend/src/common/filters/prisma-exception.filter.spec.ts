import { ErrorCode } from '@cityborn/api';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DefaultExceptionFilter } from './default-exception.filter';
import { PrismaExceptionFilter } from './prisma-exception.filter';

@Controller()
class ThrowingController {
  @Get('conflict')
  conflict() {
    throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '7.8.0',
    });
  }

  @Get('missing')
  missing() {
    throw new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.8.0',
    });
  }

  @Get('other')
  other() {
    throw new Prisma.PrismaClientKnownRequestError(
      'Foreign key constraint failed',
      { code: 'P2003', clientVersion: '7.8.0' },
    );
  }
}

describe('PrismaExceptionFilter registration order', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ThrowingController],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(
      new DefaultExceptionFilter(),
      new PrismaExceptionFilter(),
    );
    await app.init();
  });

  afterAll(() => app.close());

  it('maps P2002 to 409 RESOURCE_ALREADY_EXISTS', async () => {
    const response = await request(app.getHttpServer()).get('/conflict');

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      statusCode: 409,
      code: ErrorCode.RESOURCE_ALREADY_EXISTS,
    });
  });

  it('maps P2025 to 404 RESOURCE_NOT_FOUND', async () => {
    const response = await request(app.getHttpServer()).get('/missing');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      code: ErrorCode.RESOURCE_NOT_FOUND,
    });
  });

  it('falls back to 500 UNKNOWN_ERROR for an unmapped Prisma code', async () => {
    const response = await request(app.getHttpServer()).get('/other');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      statusCode: 500,
      code: ErrorCode.UNKNOWN_ERROR,
    });
  });
});
