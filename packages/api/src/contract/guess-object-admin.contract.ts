import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
  IdParamSchema,
  IdSchema,
  IncludeQuerySchema,
} from '../schemas/common.schema.js';
import {
  CreateGuessObjectSchema,
  GuessObjectSchema,
  GuessObjectsSchema,
} from '../schemas/guess-object.schema.js';

const c = initContract();

export const guessObjectAdminContract = c.router({
  listGuessObjects: {
    method: 'GET',
    path: '/guess-objects',
    query: z.object({ guessObjectsIds: z.string() }),
    responses: { 200: GuessObjectsSchema },
  },
  getGuessObject: {
    method: 'GET',
    path: '/guess-objects/:id',
    pathParams: IdParamSchema,
    query: IncludeQuerySchema,
    responses: { 200: GuessObjectSchema },
  },
  createGuessObject: {
    method: 'POST',
    path: '/guess-objects',
    body: CreateGuessObjectSchema,
    responses: { 201: IdSchema },
  },
  updateGuessObject: {
    method: 'PATCH',
    path: '/guess-objects/:id',
    pathParams: IdParamSchema,
    body: GuessObjectSchema.partial(),
    responses: { 200: IdSchema },
  },
  deleteGuessObject: {
    method: 'DELETE',
    path: '/guess-objects/:id',
    pathParams: IdParamSchema,
    body: emptyRequestBodySchema,
    responses: { 204: emptyResponseSchema },
  },
});
