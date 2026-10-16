import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import type { ApiDomain } from '../contract/api-domain';
import { commonErrorResponses } from '../errors/api-error.schema';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
  IncludeQuerySchema,
} from '../protocol/payload.schema';
import {
  GuessObjectIdParamSchema,
  GuessObjectUuidIdSchema,
} from './guess-object.id';
import {
  CreateGuessObjectSchema,
  FullGuessObjectSchema,
  FullGuessObjectsSchema,
  GuessObjectSchema,
  GuessObjectsSchema,
  PatchGuessObjectSchema,
} from './guess-object.schema';

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
