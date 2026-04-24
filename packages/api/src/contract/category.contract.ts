import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { CategorySchema } from '../schemas/category.schema.js';

const c = initContract();

export const categoryContract = c.router({
  getCategories: {
    method: 'GET',
    path: '/category',
    responses: { 200: z.object({ categories: z.array(CategorySchema) }) },
  },
});
