import { initContract } from '@ts-rest/core';
import type { ApiDomain } from '../contract/api-domain';
import { commonErrorResponses } from '../errors/api-error.schema';
import { WorldLocationUuidIdSchema } from './world-location.id';
import { CreateWorldLocationSchema } from './world-location.schema';

const c = initContract();

export const worldLocationAdminContract = c.router(
  {
    createWorldLocation: {
      method: 'POST',
      path: '/',
      body: CreateWorldLocationSchema,
      responses: { 201: WorldLocationUuidIdSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/world-location' satisfies `/${ApiDomain}` },
);
