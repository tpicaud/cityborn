import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import type { ApiDomain } from '../contract/api-domain';
import { commonErrorResponses } from '../errors/api-error.schema';
import { IncludeQuerySchema } from '../protocol/payload.schema';
import { GuessObjectIdParamSchema } from './guess-object.id';
import { GuessObjectSchema, GuessObjectsSchema } from './guess-object.schema';

const c = initContract();

export const guessObjectContract = c.router(
  {
    getGuessObjects: {
      method: 'GET',
      path: '/',
      query: z.object({ guessObjectsIds: z.string() }),
      responses: { 200: GuessObjectsSchema, ...commonErrorResponses },
    },
    getGuessObject: {
      method: 'GET',
      path: '/:id',
      pathParams: GuessObjectIdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: GuessObjectSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/guess-object' satisfies `/${ApiDomain}` },
);
