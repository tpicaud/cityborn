import { SessionMode, UserSchema } from '@cityborn/api';
import { GameMode } from '@prisma/client';
import {
  buildPrismaGameRecord,
  buildPrismaUser,
} from '../../test/support/fixtures';
import { UserMapper } from './user.mapper';

describe('UserMapper.toUser', () => {
  it('maps the user and loaded game records', () => {
    const user = UserMapper.toUser({
      ...buildPrismaUser(),
      gameRecords: [
        buildPrismaGameRecord({
          mode: GameMode.multi,
          players: [{ username: 'host', isGuest: false }],
          results: { host: { results: [] } },
        }),
      ],
    });

    expect(() => UserSchema.parse(user)).not.toThrow();
    expect(user).toMatchObject({
      type: 'email',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      relations: { games: [{ mode: SessionMode.MULTI }] },
    });
  });

  it('omits an absent update date and unloaded game records', () => {
    const user = UserMapper.toUser(buildPrismaUser({ updatedAt: null }));

    expect(user.updatedAt).toBeUndefined();
    expect(user.relations?.games).toBeUndefined();
  });
});

describe('UserMapper.toPublicUser', () => {
  it('keeps only public identity fields', () => {
    const user = UserMapper.toPublicUser({
      id: 'user-1',
      username: 'alice',
    });

    expect(user).toEqual({ id: 'user-1', username: 'alice' });
  });
});
