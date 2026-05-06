import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { GuessObjectCandidatesSchema } from '../schemas/guess-object.schema.js';
import { WorldLocationsSchema } from '../schemas/world-location.schema.js';

const c = initContract();

export const searchAdminContract = c.router({
  searchGuessObject: {
    method: 'GET',
    path: '/search/guess-object',
    query: z.object({
      q: z.string().optional(),
      external_id: z.string().optional(),
    }),
    responses: {
      200: GuessObjectCandidatesSchema,
    },
  },
  searchWorldLocation: {
    method: 'GET',
    path: '/search/world-location',
    query: z.object({
      q: z.string().optional(),
      id: z.string().optional(),
      osm_type: z.string().optional(),
    }),
    responses: { 200: WorldLocationsSchema },
  },
});
