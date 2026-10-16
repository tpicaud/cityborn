import { initContract } from '@ts-rest/core';
import type { ApiDomain } from '../contract/api-domain';
import { commonErrorResponses } from '../errors/api-error.schema';
import { IncludeQuerySchema } from '../protocol/payload.schema';
import { CategoryIdParamSchema } from './category.id';
import {
  CategoriesSchema,
  CategorySchema,
  CategoryTreesSchema,
} from './category.schema';

const c = initContract();

export const categoryContract = c.router(
  {
    getCategoryTrees: {
      method: 'GET',
      path: '/tree',
      responses: { 200: CategoryTreesSchema, ...commonErrorResponses },
    },
    getCategory: {
      method: 'GET',
      path: '/:id',
      pathParams: CategoryIdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: CategorySchema, ...commonErrorResponses },
    },
    getCategories: {
      method: 'GET',
      path: '/',
      query: IncludeQuerySchema,
      responses: { 200: CategoriesSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/category' satisfies `/${ApiDomain}` },
);
