import { z } from 'zod';

export const IdSchema = z.string().uuid();
export const IsoDateTimeSchema = z.string().datetime({ offset: true });
export const emptyRequestBodySchema = z.object({});
export const emptyResponseSchema = z.object({});
export const requestErrorSchema = z.object({
  status: z.number(),
});

export const IdParamSchema = z.object({ id: z.string() });
export const IncludeQuerySchema = z.object({ include: z.string().optional() });

export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;
