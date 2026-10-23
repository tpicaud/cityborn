import { initContract } from '@ts-rest/core';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
  IncludeQuerySchema,
} from '../protocol/payload.schema';
import {
  CreatePackSchema,
  FullPackSchema,
  PackIdParamSchema,
  PackSchema,
  PacksSchema,
  PackTreesSchema,
  UpdatePackSchema,
} from './pack.schema';

const c = initContract();

export const packAdminContract = c.router(
  {
    getPackTrees: {
      method: 'GET',
      path: '/tree',
      responses: { 200: PackTreesSchema },
    },
    getAllPacks: {
      method: 'GET',
      path: '/',
      query: IncludeQuerySchema,
      responses: { 200: PacksSchema },
    },
    getPack: {
      method: 'GET',
      path: '/:id',
      pathParams: PackIdParamSchema,
      responses: { 200: PackSchema },
    },
    getFullPack: {
      method: 'GET',
      path: '/:id/full',
      pathParams: PackIdParamSchema,
      responses: { 200: FullPackSchema },
    },
    createPack: {
      method: 'POST',
      path: '/',
      body: CreatePackSchema,
      responses: { 201: PackSchema },
    },
    updatePack: {
      method: 'PUT',
      path: '/:id',
      pathParams: PackIdParamSchema,
      body: UpdatePackSchema,
      responses: { 200: PackSchema },
    },
    deletePack: {
      method: 'DELETE',
      path: '/:id',
      pathParams: PackIdParamSchema,
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema },
    },
  },
  { pathPrefix: '/pack' },
);
