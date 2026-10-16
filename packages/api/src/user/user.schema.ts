import { z } from 'zod';
import { GameRecordSchema } from '../game-record/game-record.schema';
import { UserIdSchema, UsernameSchema } from './user.id';

export const AccountTypeSchema = z.enum(['email', 'google', 'apple']);

export const UserRoleSchema = z.enum(['player', 'admin']);

export const PublicUserSchema = z.object({
  id: UserIdSchema,
  username: UsernameSchema,
});

export const UserSchema = PublicUserSchema.extend({
  email: z.string().email(),
  type: AccountTypeSchema,
  role: UserRoleSchema,
  isVerified: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  relations: z
    .object({
      games: z.array(GameRecordSchema).optional(),
    })
    .optional(),
});

export const UsernameInputSchema = z
  .string()
  .min(3)
  .max(20)
  .pipe(UsernameSchema);

export const UpdateUsernameSchema = z.object({
  username: UsernameInputSchema,
});

export type AccountType = z.infer<typeof AccountTypeSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type User = z.infer<typeof UserSchema>;
export type UpdateUsername = z.infer<typeof UpdateUsernameSchema>;
