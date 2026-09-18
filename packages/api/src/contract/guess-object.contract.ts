import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { commonErrorResponses } from '../schemas/api-error.schema';
import {
  GuessObjectIdParamSchema,
  IncludeQuerySchema,
} from '../schemas/common.schema';
import {
  GuessObjectSchema,
  GuessObjectsSchema,
} from '../schemas/guess-object.schema';

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
  { pathPrefix: '/guess-object' },
);
