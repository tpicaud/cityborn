import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { emptyResponseSchema, IdSchema } from '../schemas/common.schema.js';
import {
  CreateGuessObjectSchema,
  GuessObjectSchema,
  GuessObjectsSchema,
} from '../schemas/guess-object.schema.js';

const c = initContract();

export const guessObjectAdminContract = c.router({
  listGuessObjects: {
    method: 'GET',
    path: '/admin/guess-objects',
    query: z.object({ guessObjectsIds: z.string() }),
    responses: { 200: GuessObjectsSchema },
  },
  getGuessObject: {
    method: 'GET',
    path: '/admin/guess-objects/:id',
    pathParams: z.object({ id: z.string() }),
    query: z.object({ include: z.string().optional() }),
    responses: { 200: GuessObjectSchema },
  },
  createGuessObject: {
    method: 'POST',
    path: '/admin/guess-objects',
    body: CreateGuessObjectSchema,
    responses: { 200: IdSchema },
  },
  updateGuessObject: {
    method: 'PATCH',
    path: '/admin/guess-objects/:id',
    pathParams: z.object({ id: z.string() }),
    body: GuessObjectSchema.partial(),
    responses: { 200: IdSchema },
  },
  deleteGuessObject: {
    method: 'DELETE',
    path: '/admin/guess-objects/:id',
    pathParams: z.object({ id: z.string() }),
    body: z.object({}),
    responses: { 204: emptyResponseSchema },
  },
});
