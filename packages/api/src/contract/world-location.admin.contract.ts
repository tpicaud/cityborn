import { initContract } from '@ts-rest/core';
import { commonErrorResponses } from '../schemas/api-error.schema';
import { IdSchema } from '../schemas/common.schema';
import { CreateWorldLocationSchema } from '../schemas/world-location.schema';

const c = initContract();

export const worldLocationAdminContract = c.router(
  {
    createWorldLocation: {
      method: 'POST',
      path: '/',
      body: CreateWorldLocationSchema,
      responses: { 201: IdSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/world-location' },
);
