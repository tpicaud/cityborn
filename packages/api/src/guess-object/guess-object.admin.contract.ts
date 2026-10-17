import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
  IncludeQuerySchema,
} from '../protocol/payload.schema';
import {
  CreateGuessObjectSchema,
  FullGuessObjectSchema,
  FullGuessObjectsSchema,
  GuessObjectIdParamSchema,
  GuessObjectSchema,
  GuessObjectsSchema,
  GuessObjectUuidIdSchema,
  PatchGuessObjectSchema,
} from './guess-object.schema';

const c = initContract();

export const guessObjectAdminContract = c.router(
  {
    getFullGuessObjects: {
      method: 'GET',
      path: '/full',
      query: z.object({ guessObjectsIds: z.string() }),
      responses: { 200: FullGuessObjectsSchema },
    },
    getFullGuessObject: {
      method: 'GET',
      path: '/:id/full',
      pathParams: GuessObjectIdParamSchema,
      responses: { 200: FullGuessObjectSchema },
    },
    getGuessObject: {
      method: 'GET',
      path: '/:id',
      pathParams: GuessObjectIdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: GuessObjectSchema },
    },
    getGuessObjects: {
      method: 'GET',
      path: '/',
      query: z.object({ guessObjectsIds: z.string() }),
      responses: { 200: GuessObjectsSchema },
    },
    createGuessObject: {
      method: 'POST',
      path: '/',
      body: CreateGuessObjectSchema,
      responses: { 201: GuessObjectUuidIdSchema },
    },
    updateGuessObject: {
      method: 'PATCH',
      path: '/:id',
      pathParams: GuessObjectIdParamSchema,
      body: PatchGuessObjectSchema,
      responses: { 200: GuessObjectUuidIdSchema },
    },
    deleteGuessObject: {
      method: 'DELETE',
      path: '/:id',
      pathParams: GuessObjectIdParamSchema,
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema },
    },
  },
  { pathPrefix: '/guess-object' },
);
