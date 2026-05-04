import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  CategoriesSchema,
  CategorySchema,
} from '../schemas/category.schema.js';

const c = initContract();

export const categoryContract = c.router({
  getCategories: {
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
});
