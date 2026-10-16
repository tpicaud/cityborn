import { initContract } from '@ts-rest/core';
import type { ApiDomain } from '../protocol/api-domain';
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
      responses: { 200: CategoryTreesSchema },
    },
    getCategory: {
      method: 'GET',
      path: '/:id',
      pathParams: CategoryIdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: CategorySchema },
    },
    getCategories: {
      method: 'GET',
      path: '/',
      query: IncludeQuerySchema,
      responses: { 200: CategoriesSchema },
    },
  },
  { pathPrefix: '/category' satisfies `/${ApiDomain}` },
);
