import { z } from 'zod';

export const IdSchema = z.string().uuid();
export const emptyRequestBodySchema = z.object({});
export const emptyResponseSchema = z.object({});
export const requestErrorSchema = z.object({
  status: z.number(),
});

export const IdParamSchema = z.object({ id: z.string() });
export const IncludeQuerySchema = z.object({ include: z.string().optional() });
