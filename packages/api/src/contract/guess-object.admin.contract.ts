import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { commonErrorResponses } from '../schemas/api-error.schema.js';
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

export const guessObjectAdminContract = c.router(
  {
    listGuessObjects: {
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
      body: GuessObjectSchema.partial(),
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
  { pathPrefix: '/guess-objects' },
);
