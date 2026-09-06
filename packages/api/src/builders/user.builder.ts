import type { User } from '../schemas/user.schema';

export function buildUser(overrides: Partial<User> = {}): User {
  return structuredClone({
    id: '00000000-0000-4000-8000-000000000001',
    username: 'host',
    email: 'host@cityborn.test',
    type: 'email',
    isVerified: true,
    ...overrides,
  });
}
