import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { GuessObjectSchema } from '../schemas/guess-object.schema.js';

const c = initContract();

export const guessObjectContract = c.router({
  getGuessObjects: {
    method: 'GET',
    path: '/guess-objects',
    query: z.object({ guessObjectsIds: z.string() }),
    responses: { 200: z.object({ guessObjects: z.array(GuessObjectSchema) }) },
  },
  getGuessObject: {
    method: 'GET',
    path: '/guess-objects/:id',
    pathParams: z.object({ id: z.string() }),
    query: z.object({ include: z.string().optional() }),
    responses: { 200: GuessObjectSchema },
  },
});
