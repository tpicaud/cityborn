import { initContract } from '@ts-rest/core';
import { commonErrorResponses } from '../schemas/api-error.schema';
import {
  CategoriesSchema,
  CategorySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
} from '../schemas/category.schema';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
  IdParamSchema,
  IncludeQuerySchema,
} from '../schemas/common.schema';

const c = initContract();

export const categoryAdminContract = c.router(
  {
    listCategories: {
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
    createCategory: {
      method: 'POST',
      path: '/',
      body: CreateCategorySchema,
      responses: { 201: CategorySchema, ...commonErrorResponses },
    },
    updateCategory: {
      method: 'PUT',
      path: '/:id',
      pathParams: IdParamSchema,
      body: UpdateCategorySchema,
      responses: { 200: CategorySchema, ...commonErrorResponses },
    },
    deleteCategory: {
      method: 'DELETE',
      path: '/:id',
      pathParams: IdParamSchema,
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/category' },
);
