import { initContract } from '@ts-rest/core';
import { IncludeQuerySchema } from '../protocol/payload.schema';
import {
  PackIdParamSchema,
  PackSchema,
  PacksSchema,
  PackTreesSchema,
} from './pack.schema';

const c = initContract();

export const packContract = c.router(
  {
    getPackTrees: {
      method: 'GET',
      path: '/tree',
      responses: { 200: PackTreesSchema },
    },
    getPack: {
      method: 'GET',
      path: '/:id',
      pathParams: PackIdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: PackSchema },
    },
    getPacks: {
      method: 'GET',
      path: '/',
      query: IncludeQuerySchema,
      responses: { 200: PacksSchema },
    },
  },
  { pathPrefix: '/pack' },
);
