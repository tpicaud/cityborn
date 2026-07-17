import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { commonErrorResponses } from '../schemas/api-error.schema';
import { IdParamSchema, IncludeQuerySchema } from '../schemas/common.schema';
import {
  FullGuessObjectSchema,
  FullGuessObjectsSchema,
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
      pathParams: IdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: GuessObjectSchema, ...commonErrorResponses },
    },
    getFullGuessObject: {
      method: 'GET',
      path: '/:id',
      pathParams: IdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: FullGuessObjectSchema, ...commonErrorResponses },
    },
    getFullGuessObjects: {
      method: 'GET',
      path: '/',
      query: z.object({ guessObjectsIds: z.string() }),
      responses: { 200: FullGuessObjectsSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/guess-object' },
);
