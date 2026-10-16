import { initContract } from '@ts-rest/core';
import type { ApiDomain } from '../protocol/api-domain';
import { WorldLocationUuidIdSchema } from './world-location.id';
import { CreateWorldLocationSchema } from './world-location.schema';

const c = initContract();

export const worldLocationAdminContract = c.router(
  {
    createWorldLocation: {
      method: 'POST',
      path: '/',
      body: CreateWorldLocationSchema,
      responses: { 201: WorldLocationUuidIdSchema },
    },
  },
  { pathPrefix: '/world-location' satisfies `/${ApiDomain}` },
);
