import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { commonErrorResponses } from '../schemas/api-error.schema';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
  IdParamSchema,
  IdSchema,
  IncludeQuerySchema,
} from '../schemas/common.schema';
import {
  CreateGuessObjectSchema,
  FullGuessObjectSchema,
  FullGuessObjectsSchema,
  GuessObjectSchema,
  GuessObjectsSchema,
  PatchGuessObjectSchema,
} from '../schemas/guess-object.schema';

const c = initContract();

export const guessObjectAdminContract = c.router(
  {
    getGuessObject: {
      method: 'GET',
      path: '/:id',
      pathParams: IdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: GuessObjectSchema, ...commonErrorResponses },
    },
    getGuessObjects: {
      method: 'GET',
      path: '/',
      query: z.object({ guessObjectsIds: z.string() }),
      responses: { 200: GuessObjectsSchema, ...commonErrorResponses },
    },
    getFullGuessObject: {
      method: 'GET',
      path: '/:id/full',
      pathParams: IdParamSchema,
      responses: { 200: FullGuessObjectSchema, ...commonErrorResponses },
    },
    getFullGuessObjects: {
      method: 'GET',
      path: '/full',
      query: z.object({ guessObjectsIds: z.string() }),
      responses: { 200: FullGuessObjectsSchema, ...commonErrorResponses },
    },
    createGuessObject: {
      method: 'POST',
      path: '/',
      body: CreateGuessObjectSchema,
      responses: { 201: IdSchema, ...commonErrorResponses },
    },
    updateGuessObject: {
      method: 'PATCH',
      path: '/:id',
      pathParams: IdParamSchema,
      body: PatchGuessObjectSchema,
      responses: { 200: IdSchema, ...commonErrorResponses },
    },
    deleteGuessObject: {
      method: 'DELETE',
      path: '/:id',
      pathParams: IdParamSchema,
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/guess-object' },
);
