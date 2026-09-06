import { buildCreateGameRecord, ErrorCode, SessionMode } from '@cityborn/api';
import type {
  EmailVerificationToken,
  GameRecord as PrismaGameRecord,
  User as PrismaUser,
} from '@prisma/client';
import { createMock } from '../../test/support/createMock';
import type { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';

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

type PrismaUserWithGameRecords = PrismaUser & {
  gameRecords: PrismaGameRecord[];
};

const prismaUserWithGameRecords = {
  ...prismaUser,
  gameRecords: [prismaGameRecord],
} satisfies PrismaUserWithGameRecords;

const verificationToken = {
  id: 'token-id',
  token: 'verification-token',
  userId: '00000000-0000-4000-8000-000000000001',
  expiresAt: new Date(Date.now() + 60_000),
  createdAt: new Date(),
} satisfies EmailVerificationToken;

function buildUserService() {
  const prismaService = createMock<PrismaService>();
  const userService = new UserService(prismaService);

  return { prismaService, userService };
}

describe('UserService persistence', () => {
  it('creates a user', async () => {
    const { prismaService, userService } = buildUserService();
    const persistedUser = prismaUser;
    prismaService.user.create.mockResolvedValue(persistedUser);

    const user = await userService.createUser({
      email: persistedUser.email,
      username: persistedUser.username,
      type: 'email',
    });

    expect(user).toBe(persistedUser);
  });

  it('deletes a user by id', async () => {
    const { prismaService, userService } = buildUserService();
    prismaService.user.delete.mockResolvedValue(prismaUser);

    await userService.deleteUser('user-1');

    expect(prismaService.user.delete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });

  it('finds a user by email or username', async () => {
    const { prismaService, userService } = buildUserService();
    prismaService.user.findFirst.mockResolvedValue(prismaUser);

    await userService.findByIdentifier('host');

    expect(prismaService.user.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ email: 'host' }, { username: 'host' }] },
    });
  });

  it('finds a user by Apple id', async () => {
    const { prismaService, userService } = buildUserService();
    prismaService.user.findFirst.mockResolvedValue(prismaUser);

    await userService.findByAppleId('apple-1');

    expect(prismaService.user.findFirst).toHaveBeenCalledWith({
      where: { appleId: 'apple-1' },
    });
  });
});

describe('UserService.validateIdentifiers', () => {
  it('accepts unused identifiers', async () => {
    const { prismaService, userService } = buildUserService();
    prismaService.user.findFirst.mockResolvedValue(null);

    await expect(
      userService.validateIdentifiers('alice', 'alice@cityborn.test'),
    ).resolves.toBeUndefined();
  });

  it('rejects an existing username', async () => {
    const { prismaService, userService } = buildUserService();
    prismaService.user.findFirst.mockResolvedValue({
      ...prismaUser,
      username: 'alice',
    });

    await expect(
      userService.validateIdentifiers('alice', 'other@cityborn.test'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_USERNAME_ALREADY_EXISTS },
    });
  });

  it('rejects an existing email', async () => {
    const { prismaService, userService } = buildUserService();
    prismaService.user.findFirst.mockResolvedValue({
      ...prismaUser,
      username: 'other',
      email: 'alice@cityborn.test',
    });

    await expect(
      userService.validateIdentifiers('alice', 'alice@cityborn.test'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_EMAIL_ALREADY_TAKEN },
    });
  });
});

describe('UserService.createEmailVerificationToken', () => {
  it('rejects a request during the cooldown', async () => {
    const { prismaService, userService } = buildUserService();
    prismaService.emailVerificationToken.findFirst.mockResolvedValue({
      ...verificationToken,
      createdAt: new Date(),
    });

    await expect(
      userService.createEmailVerificationToken('user-1', 60_000),
    ).rejects.toMatchObject({
      response: {
        code: ErrorCode.USER_VERIFICATION_EMAIL_RESEND_TOO_SOON,
      },
    });
  });

  it('replaces previous tokens and returns a fresh token', async () => {
    const { prismaService, userService } = buildUserService();
    prismaService.emailVerificationToken.findFirst.mockResolvedValue(null);
    prismaService.$transaction.mockResolvedValue([]);

    const token = await userService.createEmailVerificationToken(
      'user-1',
      60_000,
    );

    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('UserService.verifyEmail', () => {
  it('rejects a missing token', async () => {
    const { prismaService, userService } = buildUserService();
    prismaService.emailVerificationToken.findUnique.mockResolvedValue(null);

    await expect(userService.verifyEmail('missing')).rejects.toMatchObject({
      response: {
        code: ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN,
      },
    });
  });

  it('deletes and rejects an expired token', async () => {
    const { prismaService, userService } = buildUserService();
    prismaService.emailVerificationToken.findUnique.mockResolvedValue({
      ...verificationToken,
      expiresAt: new Date(Date.now() - 1),
    });
    prismaService.emailVerificationToken.delete.mockResolvedValue(
      verificationToken,
    );

    await expect(userService.verifyEmail('expired')).rejects.toMatchObject({
      response: {
        code: ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN,
      },
    });
    expect(prismaService.emailVerificationToken.delete).toHaveBeenCalledWith({
      where: { id: 'token-id' },
    });
  });

  it('verifies the user and removes its tokens', async () => {
    const { prismaService, userService } = buildUserService();
    const token = verificationToken;
    const persistedUser = prismaUser;
    prismaService.emailVerificationToken.findUnique.mockResolvedValue(token);
    prismaService.$transaction.mockResolvedValue([persistedUser]);

    const user = await userService.verifyEmail(token.token);

    expect(user).toBe(persistedUser);
  });
});

describe('UserService.getGameRecords', () => {
  it('rejects an unknown user', async () => {
    const { prismaService, userService } = buildUserService();
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(userService.getGameRecords('missing')).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });

  it('maps the five most recent records', async () => {
    const { prismaService, userService } = buildUserService();
    prismaService.user.findUnique.mockResolvedValue(prismaUserWithGameRecords);

    const records = await userService.getGameRecords('user-1');

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      include: {
        gameRecords: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
    expect(records).toHaveLength(1);
  });
});

describe('UserService.saveSoloGameRecord', () => {
  it('rejects a multiplayer record', async () => {
    const { userService } = buildUserService();

    await expect(
      userService.saveSoloGameRecord(
        'user-1',
        buildCreateGameRecord({ mode: SessionMode.MULTI }),
      ),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.BAD_REQUEST },
    });
  });

  it('persists a solo record for the user', async () => {
    const { prismaService, userService } = buildUserService();
    const record = buildCreateGameRecord();
    prismaService.gameRecord.create.mockResolvedValue(prismaGameRecord);

    await userService.saveSoloGameRecord('user-1', record);

    expect(prismaService.gameRecord.create).toHaveBeenCalledWith({
      data: {
        mode: SessionMode.SOLO,
        gameConfig: record.gameConfig,
        players: record.players,
        guessObjectsIds: record.guessObjectsIds,
        results: record.results,
        users: { connect: { id: 'user-1' } },
      },
    });
  });
});
