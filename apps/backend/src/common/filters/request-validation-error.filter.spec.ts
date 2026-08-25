import { ErrorCode } from '@cityborn/api';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RequestValidationError } from '@ts-rest/nest';
import request from 'supertest';
import type { App } from 'supertest/types';
import { z } from 'zod';
import { DefaultExceptionFilter } from './default-exception.filter';
import { RequestValidationErrorFilter } from './request-validation-error.filter';

@Controller()
class ThrowingController {
  @Get('boom')
  boom() {
    const bodyResult = z.object({ foo: z.string() }).safeParse({});
    throw new RequestValidationError(
      null,
      null,
      null,
      bodyResult.success ? null : bodyResult.error,
    );
  }
}

describe('RequestValidationErrorFilter registration order', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ThrowingController],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalFilters(
      new DefaultExceptionFilter(),
      new RequestValidationErrorFilter(),
    );
    await app.init();
  });

  afterAll(() => app.close());

  it('formats a ts-rest validation error as a BAD_REQUEST ApiError', async () => {
    const response = await request(app.getHttpServer()).get('/boom');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: ErrorCode.BAD_REQUEST,
      statusCode: 400,
    });
    expect(response.body.message).toContain('foo');
    expect(response.body.fieldErrors).toEqual([
      { path: 'foo', message: expect.any(String) },
    ]);
  });
});
