import { z } from 'zod';

export const IdSchema = z.string().uuid();
export const emptyRequestBodySchema = z.object({});
export const emptyResponseSchema = z.object({});
export const requestErrorSchema = z.object({
  status: z.number(),
});
