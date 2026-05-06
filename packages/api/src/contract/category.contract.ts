import { initContract } from '@ts-rest/core';
import {
  CategoriesSchema,
  CategorySchema,
} from '../schemas/category.schema.js';
import { IdParamSchema, IncludeQuerySchema } from '../schemas/common.schema.js';

const c = initContract();

export const categoryContract = c.router({
  getCategories: {
    method: 'GET',
    path: '/category',
    query: IncludeQuerySchema,
    responses: { 200: CategoriesSchema },
  },
  getCategory: {
    method: 'GET',
    path: '/category/:id',
    pathParams: IdParamSchema,
    query: IncludeQuerySchema,
    responses: { 200: CategorySchema },
  },
});
