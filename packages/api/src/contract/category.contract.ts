import { initContract } from '@ts-rest/core';
import { commonErrorResponses } from '../schemas/api-error.schema';
import {
  CategoriesSchema,
  CategorySchema,
} from '../schemas/category.schema';
import { IdParamSchema, IncludeQuerySchema } from '../schemas/common.schema';

const c = initContract();

export const categoryContract = c.router(
  {
    getCategory: {
      method: 'GET',
      path: '/:id',
      pathParams: IdParamSchema,
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
  { pathPrefix: '/category' },
);
