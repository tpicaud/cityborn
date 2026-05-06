import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  CategoriesSchema,
  CategorySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
} from '../schemas/category.schema.js';
import { emptyResponseSchema } from '../schemas/common.schema.js';

const c = initContract();

export const categoryAdminContract = c.router({
  listCategories: {
    method: 'GET',
    path: '/category',
    query: z.object({ include: z.string().optional() }),
    responses: { 200: CategoriesSchema },
  },
  getCategory: {
    method: 'GET',
    path: '/category/:id',
    pathParams: z.object({ id: z.string() }),
    query: z.object({ include: z.string().optional() }),
    responses: { 200: CategorySchema },
  },
  createCategory: {
    method: 'POST',
    path: '/category',
    body: CreateCategorySchema,
    responses: { 201: CategorySchema },
  },
  updateCategory: {
    method: 'PUT',
    path: '/category/:id',
    pathParams: z.object({ id: z.string() }),
    body: UpdateCategorySchema,
    responses: { 200: CategorySchema },
  },
  deleteCategory: {
    method: 'DELETE',
    path: '/category/:id',
    pathParams: z.object({ id: z.string() }),
    body: z.object({}),
    responses: { 204: emptyResponseSchema },
  },
});
