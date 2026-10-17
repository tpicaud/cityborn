import { initContract } from '@ts-rest/core';
import { IncludeQuerySchema } from '../protocol/payload.schema';
import {
  CategoriesSchema,
  CategoryIdParamSchema,
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
  { pathPrefix: '/category' },
);
