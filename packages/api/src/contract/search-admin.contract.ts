import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { GuessObjectCandidateSchema } from '../schemas/guess-object.schema.js';
import { WorldLocationSchema } from '../schemas/world-location.schema.js';

const c = initContract();

const oneOrMany = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.array(schema)]);

export const searchAdminContract = c.router({
  searchGuessObject: {
    method: 'GET',
    path: '/admin/search/guess-object',
    query: z.object({
      q: z.string().optional(),
      external_id: z.string().optional(),
    }),
    responses: {
      200: z.object({ results: oneOrMany(GuessObjectCandidateSchema) }),
    },
  },
  searchWorldLocation: {
    method: 'GET',
    path: '/admin/search/world-location',
    query: z.object({
      q: z.string().optional(),
      id: z.string().optional(),
      osm_type: z.string().optional(),
    }),
    responses: { 200: z.object({ results: oneOrMany(WorldLocationSchema) }) },
  },
});
