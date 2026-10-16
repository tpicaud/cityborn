import { initContract } from '@ts-rest/core';
import type { ApiDomain } from '../contract/api-domain';
import { commonErrorResponses } from '../errors/api-error.schema';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
  IncludeQuerySchema,
} from '../protocol/payload.schema';
import { CategoryIdParamSchema } from './category.id';
import {
  CategoriesSchema,
  CategorySchema,
  CategoryTreesSchema,
  CreateCategorySchema,
  FullCategorySchema,
  UpdateCategorySchema,
} from './category.schema';

const c = initContract();

export const categoryAdminContract = c.router(
  {
    getCategoryTrees: {
      method: 'GET',
      path: '/tree',
      responses: { 200: CategoryTreesSchema, ...commonErrorResponses },
    },
    getAllCategories: {
      method: 'GET',
      path: '/',
      query: IncludeQuerySchema,
      responses: { 200: CategoriesSchema, ...commonErrorResponses },
    },
    getCategory: {
      method: 'GET',
      path: '/:id',
      pathParams: CategoryIdParamSchema,
      responses: { 200: CategorySchema, ...commonErrorResponses },
    },
    getFullCategory: {
      method: 'GET',
      path: '/:id/full',
      pathParams: CategoryIdParamSchema,
      responses: { 200: FullCategorySchema, ...commonErrorResponses },
    },
    createCategory: {
      method: 'POST',
      path: '/',
      body: CreateCategorySchema,
      responses: { 201: CategorySchema, ...commonErrorResponses },
    },
    updateCategory: {
      method: 'PUT',
      path: '/:id',
      pathParams: CategoryIdParamSchema,
      body: UpdateCategorySchema,
      responses: { 200: CategorySchema, ...commonErrorResponses },
    },
    deleteCategory: {
      method: 'DELETE',
      path: '/:id',
      pathParams: CategoryIdParamSchema,
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/category' satisfies `/${ApiDomain}` },
);
