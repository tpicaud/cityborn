import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { GuessObjectSearchResultsSchema } from '../guess-object/guess-object.schema';
import type { ApiDomain } from '../protocol/api-domain';
import { WorldLocationSearchResultsSchema } from '../world-location/world-location.schema';

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
      responses: { 200: GuessObjectSearchResultsSchema },
    },
    searchWorldLocation: {
      method: 'GET',
      path: '/world-location',
      query: z.object({
        q: z.string().optional(),
        id: z.string().optional(),
        osm_type: z.string().optional(),
      }),
      responses: { 200: WorldLocationSearchResultsSchema },
    },
  },
  { pathPrefix: '/search' satisfies `/${ApiDomain}` },
);
