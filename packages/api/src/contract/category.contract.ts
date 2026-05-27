import { initContract } from '@ts-rest/core';
import { commonErrorResponses } from '../schemas/api-error.schema.js';
import {
  CategoriesSchema,
  CategorySchema,
} from '../schemas/category.schema.js';
import { IdParamSchema, IncludeQuerySchema } from '../schemas/common.schema.js';

const c = initContract();

export const categoryContract = c.router(
  {
    getCategories: {
      method: 'GET',
      path: '/',
      query: IncludeQuerySchema,
      responses: { 200: CategoriesSchema, ...commonErrorResponses },
    },
    getCategory: {
      method: 'GET',
      path: '/:id',
      pathParams: IdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: CategorySchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/category' },
);
