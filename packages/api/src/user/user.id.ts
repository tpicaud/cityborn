import { z } from 'zod';
import { PlayerIdSchema } from '../player/player.id';

export const UserIdSchema = z.string().brand<'UserId'>();
export const UsernameSchema = PlayerIdSchema.brand<'Username'>();

export type UserId = z.infer<typeof UserIdSchema>;
export type Username = z.infer<typeof UsernameSchema>;
