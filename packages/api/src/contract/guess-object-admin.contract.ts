import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  CreateGuessObjectSchema,
  GuessObjectSchema,
} from '../schemas/guess-object.schema.js';

const c = initContract();

const IdResponseSchema = z.object({ id: z.string() });

export const guessObjectAdminContract = c.router({
  listGuessObjects: {
    method: 'GET',
    path: '/admin/guess-objects',
    query: z.object({ guessObjectsIds: z.string() }),
    responses: { 200: z.object({ guessObjects: z.array(GuessObjectSchema) }) },
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
    responses: { 201: IdResponseSchema },
  },
  updateGuessObject: {
    method: 'PATCH',
    path: '/admin/guess-objects/:id',
    pathParams: z.object({ id: z.string() }),
    body: GuessObjectSchema.partial(),
    responses: { 200: IdResponseSchema },
  },
  deleteGuessObject: {
    method: 'DELETE',
    path: '/admin/guess-objects/:id',
    pathParams: z.object({ id: z.string() }),
    body: z.object({}),
    responses: { 200: z.object({}) },
  },
});
