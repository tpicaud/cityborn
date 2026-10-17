import { z } from 'zod';

export const WorldLocationIdSchema = z.string().brand<'WorldLocationId'>();
export const WorldLocationUuidIdSchema = z
  .string()
  .uuid()
  .brand<'WorldLocationId'>();

export type WorldLocationId = z.infer<typeof WorldLocationIdSchema>;
