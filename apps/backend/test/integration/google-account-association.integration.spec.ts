import {
  type AccountType,
  buildUser,
  ErrorCode,
  type User,
} from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { AuthSession } from '../../src/common/types/auth-session';
import {
  PrismaClsModule,
  type PrismaTransactionHost,
} from '../../src/prisma/prisma-cls.module';
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY } from '../../src/user/repositories/email-verification-token.repository';
import { PrismaEmailVerificationTokenRepository } from '../../src/user/repositories/prisma-email-verification-token.repository';
import { PrismaUserRepository } from '../../src/user/repositories/prisma-user.repository';
import {
  type CreateUserData,
  USER_REPOSITORY,
  type UserCredentials,
} from '../../src/user/repositories/user.repository';
import { UserService } from '../../src/user/user.service';
import { createTestInfrastructure } from '../support/infrastructure';

const infrastructure: ReturnType<typeof createTestInfrastructure> =
  createTestInfrastructure();
let testingModule: TestingModule;
let userService: UserService;

beforeAll(async () => {
  testingModule = await Test.createTestingModule({
    imports: [PrismaClsModule],
    providers: [
      UserService,
      { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
      {
        provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
        useClass: PrismaEmailVerificationTokenRepository,
      },
    ],
  }).compile();
  await testingModule.init();
  userService = testingModule.get(UserService);
});
afterAll(async () => {
  await testingModule?.close();
  await infrastructure.close();
});

async function createUser(
  overrides: Partial<CreateUserData> = {},
): Promise<User> {
  const user: User = buildUser();
  return userService.createUser({
    email: user.email,
    username: user.username,
    type: 'email',
    ...overrides,
  });
}

describe('UserService.findByGoogleSubject', () => {
  it('keeps the account after its Google email changes', async () => {
    const user: User = await createUser({
      googleSubject: 'stable-subject',
      email: 'old@gmail.com',
      isVerified: true,
    });

    const session: AuthSession | null =
      await userService.findByGoogleSubject('stable-subject');

    expect(session?.user).toMatchObject({
      id: user.id,
      email: 'old@gmail.com',
    });
  });
});

describe('UserService.findGoogleEmailOwner', () => {
  it('matches the normalized email exactly and ignores a matching username', async () => {
    await createUser({
      username: buildUser({ username: 'alice@gmail.com' }).username,
      email: 'other@gmail.com',
    });
    const user: User = await createUser({
      username: buildUser({ username: 'alice' }).username,
      email: 'Alice@Gmail.com',
    });

    expect(
      (await userService.findGoogleEmailOwner('alice@gmail.com'))?.id,
    ).toBe(user.id);
    expect(await userService.findGoogleEmailOwner('lice@gmail.com')).toBeNull();
  });

  it('rejects multiple case variants instead of choosing a historical account', async () => {
    await createUser({ email: 'Alice@gmail.com' });
    await createUser({
      email: 'alice@gmail.com',
      username: buildUser({ username: 'another' }).username,
    });

    await expect(
      userService.findGoogleEmailOwner('alice@gmail.com'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_GOOGLE_ACCOUNT_CONFLICT },
    });
  });
});

describe('UserService.createUser', () => {
  it('allows only one account for concurrent Google subject creation', async () => {
    const outcomes: PromiseSettledResult<User>[] = await Promise.allSettled([
      createUser({ googleSubject: 'same-subject', email: 'one@gmail.com' }),
      createUser({
        googleSubject: 'same-subject',
        email: 'two@gmail.com',
        username: buildUser({ username: 'second' }).username,
      }),
    ]);

    expect(
      outcomes.filter((outcome) => outcome.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(await infrastructure.prisma.user.count()).toBe(1);
  });
});

describe('UserService.updatePassword', () => {
  it('rejects an earlier password change waiting for a Google reclaim to commit', async () => {
    const user: User = await createUser({
      isVerified: false,
      password: 'old-hash',
    });
    const credentials: UserCredentials | null =
      await userService.findCredentialsById(user.id);
    if (!credentials?.passwordHash) throw new Error('Missing credentials');
    const txHost: PrismaTransactionHost = testingModule.get(TransactionHost);
    let confirmAssociation: () => void = () => {};
    const associated: Promise<void> = new Promise((resolve) => {
      confirmAssociation = resolve;
    });
    let releaseAssociation: () => void = () => {};
    const released: Promise<void> = new Promise((resolve) => {
      releaseAssociation = resolve;
    });
    const association: Promise<AuthSession> = txHost.withTransaction(
      async () => {
        const session: AuthSession = await userService.associateGoogleAccount({
          userId: user.id,
          email: user.email,
          isVerified: false,
          subject: 'google-subject',
        });
        confirmAssociation();
        await released;
        return session;
      },
    );
    await associated;

    const passwordUpdate: Promise<void> = expect(
      userService.updatePassword({
        userId: user.id,
        passwordHash: 'attacker-hash',
        expectedPasswordHash: credentials.passwordHash,
        authVersion: credentials.authSession.authVersion,
      }),
    ).rejects.toMatchObject({
      status: 401,
      response: { code: ErrorCode.USER_CURRENT_PASSWORD_INCORRECT },
    });
    async function waitForBlockedUpdate(
      remainingAttempts: number,
    ): Promise<void> {
      const waiting: { count: bigint }[] = await infrastructure.prisma
        .$queryRaw`
        SELECT count(*) AS count FROM pg_stat_activity
        WHERE datname = current_database() AND usename = current_user
          AND wait_event_type = 'Lock' AND query LIKE 'UPDATE%User%'
      `;
      if (waiting[0]?.count === 1n) return;
      if (remainingAttempts === 0)
        throw new Error('Password update did not wait for the Google reclaim');
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      await waitForBlockedUpdate(remainingAttempts - 1);
    }
    try {
      await waitForBlockedUpdate(100);
    } finally {
      releaseAssociation();
      await Promise.all([association, passwordUpdate]);
    }

    expect(await userService.findCredentialsById(user.id)).toMatchObject({
      passwordHash: null,
      authSession: {
        authVersion: 1,
        user: { id: user.id, type: 'google', isVerified: true },
      },
    });
  });
});

describe('UserService.associateGoogleAccount', () => {
  it.each<AccountType>(['email', 'apple', 'google'])(
    'preserves verified %s credentials and progression',
    async (type) => {
      const user: User = await createUser({
        type,
        isVerified: true,
        password: 'existing-hash',
        appleId: 'existing-apple',
      });
      await infrastructure.prisma.gameRecord.create({
        data: {
          mode: 'solo',
          gameConfig: {},
          players: [],
          guessObjectsIds: [],
          results: [],
          users: { connect: { id: user.id } },
        },
      });

      const session: AuthSession = await userService.associateGoogleAccount({
        userId: user.id,
        email: user.email,
        isVerified: true,
        subject: 'google-subject',
      });

      expect(session).toMatchObject({
        authVersion: 0,
        user: { id: user.id, type, isVerified: true },
      });
      expect(
        await infrastructure.prisma.user.findUnique({
          where: { id: user.id },
          include: { gameRecords: true },
        }),
      ).toMatchObject({
        password: 'existing-hash',
        appleId: 'existing-apple',
        googleSubject: 'google-subject',
        gameRecords: [expect.objectContaining({ mode: 'solo' })],
      });
    },
  );

  it('invalidates all unverified credentials and links only after ownership proof', async () => {
    const user: User = await createUser({
      isVerified: false,
      password: 'old-hash',
      appleId: 'old-apple',
    });
    await infrastructure.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token: 'old-verification',
        expiresAt: new Date(Date.now() + 600_000),
      },
    });
    await infrastructure.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: 'old-reset',
        expiresAt: new Date(Date.now() + 600_000),
      },
    });

    const session: AuthSession = await userService.associateGoogleAccount({
      userId: user.id,
      email: user.email,
      isVerified: false,
      subject: 'google-subject',
    });

    expect(session).toMatchObject({
      authVersion: 1,
      user: { id: user.id, type: 'google', isVerified: true },
    });
    expect(
      await infrastructure.prisma.user.findUnique({ where: { id: user.id } }),
    ).toMatchObject({ password: null, appleId: null });
    expect(await infrastructure.prisma.emailVerificationToken.count()).toBe(0);
    expect(await infrastructure.prisma.passwordResetToken.count()).toBe(0);
  });

  it('rejects a proof after concurrent account verification without clearing verified access', async () => {
    const user: User = await createUser({
      isVerified: false,
      password: 'old-hash',
    });
    await infrastructure.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    await expect(
      userService.associateGoogleAccount({
        userId: user.id,
        email: user.email,
        isVerified: false,
        subject: 'google-subject',
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_GOOGLE_ACCOUNT_CONFLICT },
    });

    expect(
      await infrastructure.prisma.user.findUnique({ where: { id: user.id } }),
    ).toMatchObject({
      password: 'old-hash',
      googleSubject: null,
      authVersion: 0,
    });
  });

  it('rejects a proof when the account email has changed', async () => {
    const user: User = await createUser();
    await infrastructure.prisma.user.update({
      where: { id: user.id },
      data: { email: 'new@example.com' },
    });

    await expect(
      userService.associateGoogleAccount({
        userId: user.id,
        email: user.email,
        isVerified: false,
        subject: 'google-subject',
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_GOOGLE_ACCOUNT_CONFLICT },
    });
  });

  it('allows only one competing subject to claim the same account', async () => {
    const user: User = await createUser({ isVerified: true });

    const outcomes: PromiseSettledResult<AuthSession>[] =
      await Promise.allSettled(
        ['subject-one', 'subject-two'].map((subject) =>
          userService.associateGoogleAccount({
            userId: user.id,
            email: user.email,
            isVerified: true,
            subject,
          }),
        ),
      );

    expect(
      outcomes.filter((outcome) => outcome.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(await infrastructure.prisma.user.count()).toBe(1);
  });

  it('rolls back a conflicting subject without revoking the other account', async () => {
    await createUser({
      googleSubject: 'already-bound',
      email: 'first@gmail.com',
    });
    const user: User = await createUser({
      username: buildUser({ username: 'second' }).username,
      isVerified: false,
      password: 'old-hash',
    });

    await expect(
      userService.associateGoogleAccount({
        userId: user.id,
        email: user.email,
        isVerified: false,
        subject: 'already-bound',
      }),
    ).rejects.toMatchObject({ code: 'P2002' });

    expect(
      await infrastructure.prisma.user.findUnique({ where: { id: user.id } }),
    ).toMatchObject({
      password: 'old-hash',
      googleSubject: null,
      authVersion: 0,
      isVerified: false,
    });
  });
});
