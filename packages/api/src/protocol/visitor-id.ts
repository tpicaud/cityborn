import { z } from 'zod';

export const VisitorIdSchema = z.string().min(1).brand<'VisitorId'>();

export type VisitorId = z.infer<typeof VisitorIdSchema>;
