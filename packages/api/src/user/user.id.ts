import { z } from 'zod';

export const UserIdSchema = z.string().brand<'UserId'>();
export const UsernameSchema = z
  .string()
  .brand<'PlayerId'>()
  .brand<'Username'>();

export type UserId = z.infer<typeof UserIdSchema>;
export type Username = z.infer<typeof UsernameSchema>;
