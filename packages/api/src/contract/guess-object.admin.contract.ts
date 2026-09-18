import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { commonErrorResponses } from '../schemas/api-error.schema';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
  GuessObjectIdParamSchema,
  GuessObjectUuidIdSchema,
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
import type { ApiDomain } from './api-domain';

const c = initContract();

export const guessObjectAdminContract = c.router(
  {
    getFullGuessObjects: {
      method: 'GET',
      path: '/full',
      query: z.object({ guessObjectsIds: z.string() }),
      responses: { 200: FullGuessObjectsSchema, ...commonErrorResponses },
    },
    getFullGuessObject: {
      method: 'GET',
      path: '/:id/full',
      pathParams: GuessObjectIdParamSchema,
      responses: { 200: FullGuessObjectSchema, ...commonErrorResponses },
    },
    getGuessObject: {
      method: 'GET',
      path: '/:id',
      pathParams: GuessObjectIdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: GuessObjectSchema, ...commonErrorResponses },
    },
    getGuessObjects: {
      method: 'GET',
      path: '/',
      query: z.object({ guessObjectsIds: z.string() }),
      responses: { 200: GuessObjectsSchema, ...commonErrorResponses },
    },
    createGuessObject: {
      method: 'POST',
      path: '/',
      body: CreateGuessObjectSchema,
      responses: { 201: GuessObjectUuidIdSchema, ...commonErrorResponses },
    },
    updateGuessObject: {
      method: 'PATCH',
      path: '/:id',
      pathParams: GuessObjectIdParamSchema,
      body: PatchGuessObjectSchema,
      responses: { 200: GuessObjectUuidIdSchema, ...commonErrorResponses },
    },
    deleteGuessObject: {
      method: 'DELETE',
      path: '/:id',
      pathParams: GuessObjectIdParamSchema,
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/guess-object' satisfies `/${ApiDomain}` },
);
