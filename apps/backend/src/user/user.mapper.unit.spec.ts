import type { PublicUser, User } from '@cityborn/api';
import { UserSchema } from '@cityborn/api';
import { type User as PrismaUser, UserRole } from '@prisma/client';
import { UserMapper } from './user.mapper';

describe('UserMapper.toUser', () => {
  it('maps the user', () => {
    const prismaUser: PrismaUser = {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'host@cityborn.test',
      username: 'host',
      type: 'email',
      role: UserRole.admin,
      password: 'hashed-password',
      authVersion: 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      isVerified: true,
      appleId: null,
    };

    const user: User = UserMapper.toUser(prismaUser);

    expect(() => UserSchema.parse(user)).not.toThrow();
    expect(user).toMatchObject({
      type: 'email',
      role: 'admin',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
  });

  it('omits an absent update date', () => {
    const prismaUser: PrismaUser = {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'host@cityborn.test',
      username: 'host',
      type: 'email',
      role: UserRole.player,
      password: 'hashed-password',
      authVersion: 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      isVerified: true,
      appleId: null,
    };

    const input: PrismaUser = {
      ...prismaUser,
      updatedAt: null,
    };

    const user: User = UserMapper.toUser(input);

    expect(user.updatedAt).toBeUndefined();
  });
});

describe('UserMapper.toPublicUser', () => {
  it('keeps only public identity fields', () => {
    const input: Parameters<typeof UserMapper.toPublicUser>[0] = {
      id: 'user-1',
      username: 'alice',
    };

    const user: PublicUser = UserMapper.toPublicUser(input);

    expect(user).toEqual({ id: 'user-1', username: 'alice' });
  });
});
