import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { IncludeQuerySchema } from '../protocol/payload.schema';
import {
  GuessObjectIdParamSchema,
  GuessObjectSchema,
  GuessObjectsSchema,
} from './guess-object.schema';

const c = initContract();

export const guessObjectContract = c.router(
  {
    getGuessObjects: {
      method: 'GET',
      path: '/',
      query: z.object({ guessObjectsIds: z.string() }),
      responses: { 200: GuessObjectsSchema },
    },
    getGuessObject: {
      method: 'GET',
      path: '/:id',
      pathParams: GuessObjectIdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: GuessObjectSchema },
    },
  },
  { pathPrefix: '/guess-object' },
);
