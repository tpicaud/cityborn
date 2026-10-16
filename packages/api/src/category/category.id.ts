import { z } from 'zod';

export const CategoryIdSchema = z.string().brand<'CategoryId'>();
export const CategoryIdParamSchema = z.object({ id: CategoryIdSchema });

export type CategoryId = z.infer<typeof CategoryIdSchema>;
