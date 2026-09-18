import { SessionMode, UserSchema } from '@cityborn/api';
import {
  GameMode,
  type GameRecord as PrismaGameRecord,
  type User as PrismaUser,
} from '@prisma/client';
import { UserMapper } from './user.mapper';

describe('UserMapper.toUser', () => {
  it('maps the user and loaded game records', () => {
    const prismaUser = {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'host@cityborn.test',
      username: 'host',
      type: 'email',
      password: 'hashed-password',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      isVerified: true,
      appleId: null,
    } satisfies PrismaUser;

    const prismaGameRecord = {
      id: '00000000-0000-4000-8000-000000000040',
      mode: 'solo',
      gameConfig: { categories: [], timer: 25, nbOfObjects: 6 },
      players: [],
      guessObjectsIds: [],
      results: {},
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } satisfies PrismaGameRecord;

    const input = {
      ...prismaUser,
      gameRecords: [
        {
          ...prismaGameRecord,
          mode: GameMode.multi,
          players: [{ username: 'host', isGuest: false }],
          results: { host: { results: [] } },
        },
      ],
    } satisfies Parameters<typeof UserMapper.toUser>[0];

    const user = UserMapper.toUser(input);

    expect(() => UserSchema.parse(user)).not.toThrow();
    expect(user).toMatchObject({
      type: 'email',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      relations: { games: [{ mode: SessionMode.MULTI }] },
    });
  });

  it('omits an absent update date and unloaded game records', () => {
    const prismaUser = {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'host@cityborn.test',
      username: 'host',
      type: 'email',
      password: 'hashed-password',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      isVerified: true,
      appleId: null,
    } satisfies PrismaUser;

    const input = { ...prismaUser, updatedAt: null } satisfies Parameters<
      typeof UserMapper.toUser
    >[0];

    const user = UserMapper.toUser(input);

    expect(user.updatedAt).toBeUndefined();
    expect(user.relations?.games).toBeUndefined();
  });
});

describe('UserMapper.toPublicUser', () => {
  it('keeps only public identity fields', () => {
    const input = {
      id: 'user-1',
      username: 'alice',
    } satisfies Parameters<typeof UserMapper.toPublicUser>[0];

    const user = UserMapper.toPublicUser(input);

    expect(user).toEqual({ id: 'user-1', username: 'alice' });
  });
});
