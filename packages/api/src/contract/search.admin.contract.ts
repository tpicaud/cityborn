import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { commonErrorResponses } from '../schemas/api-error.schema';
import { GuessObjectDraftsSchema } from '../schemas/guess-object.schema';
import { WorldLocationsSchema } from '../schemas/world-location.schema';

const c = initContract();

export const searchAdminContract = c.router(
  {
    searchGuessObject: {
      method: 'GET',
      path: '/guess-object',
      query: z.object({
        q: z.string().optional(),
        external_id: z.string().optional(),
      }),
      responses: { 200: GuessObjectDraftsSchema, ...commonErrorResponses },
    },
    searchWorldLocation: {
      method: 'GET',
      path: '/world-location',
      query: z.object({
        q: z.string().optional(),
        id: z.string().optional(),
        osm_type: z.string().optional(),
      }),
      responses: { 200: WorldLocationsSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/search' },
);
