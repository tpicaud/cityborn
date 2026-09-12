import type { z } from 'zod';
import { type User, UserSchema } from '../schemas/user.schema';

export function buildUser(
  overrides: Partial<z.input<typeof UserSchema>> = {},
): User {
  return UserSchema.parse({
    id: '00000000-0000-4000-8000-000000000001',
    username: 'host',
    email: 'host@cityborn.test',
    type: 'email',
    isVerified: true,
    ...overrides,
  });
}
