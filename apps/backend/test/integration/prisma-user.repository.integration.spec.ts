import type { User } from '@cityborn/api';
import { buildUser, UsernameSchema } from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import type { AuthSession } from '../../src/common/types/auth-session';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { PrismaUserRepository } from '../../src/user/repositories/prisma-user.repository';
import type {
  CreateUserData,
  UserCredentials,
} from '../../src/user/repositories/user.repository';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaUserRepository', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  let module: TestingModule;
  let userRepository: PrismaUserRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [PrismaUserRepository],
    }).compile();
    await module.init();
    userRepository = module.get(PrismaUserRepository);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  describe('create', () => {
    it('enforces the unique email constraint', async () => {
      const firstUser: User = buildUser();
      const duplicateUser: User = buildUser({
        id: '00000000-0000-4000-8000-000000000002',
        username: 'guest',
      });
      const firstData: CreateUserData = {
        email: firstUser.email,
        username: firstUser.username,
        type: firstUser.type,
      };
      const duplicateData: CreateUserData = {
        email: duplicateUser.email,
        username: duplicateUser.username,
        type: duplicateUser.type,
      };
      await userRepository.create(firstData);

      await expect(userRepository.create(duplicateData)).rejects.toMatchObject({
        code: 'P2002',
      });
    });
  });

  describe('delete', () => {
    it('removes the requested user', async () => {
      const userData: User = buildUser();
      const user: User = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
      });

      await userRepository.delete(user.id);

      expect(await userRepository.findById(user.id)).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns a persisted user by identifier', async () => {
      const userData: User = buildUser();
      const user: User = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
      });

      const found: User | null = await userRepository.findById(user.id);

      expect(found).toMatchObject({
        id: user.id,
        email: userData.email,
      });
    });

    it('returns null for an unknown identifier', async () => {
      const absentUser: User = buildUser();

      const found: User | null = await userRepository.findById(absentUser.id);

      expect(found).toBeNull();
    });
  });

  describe('findAuthSessionById', () => {
    it('loads a newly persisted user with auth version zero', async () => {
      const userData: User = buildUser();
      const user: User = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
      });

      const authSession: AuthSession | null =
        await userRepository.findAuthSessionById(user.id);

      expect(authSession).toEqual({ user, authVersion: 0 });
    });
  });

  describe('findCredentialsByIdentifier', () => {
    it('finds persisted credentials by email', async () => {
      const userData: User = buildUser({ isVerified: false });
      const user: User = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
        isVerified: userData.isVerified,
        password: 'hashed-password',
      });

      const credentials: UserCredentials | null =
        await userRepository.findCredentialsByIdentifier('host@cityborn.test');
      expect(credentials).toMatchObject({
        authSession: {
          user: { id: user.id, username: 'host', isVerified: false },
          authVersion: 0,
        },
        passwordHash: 'hashed-password',
      });
    });

    it('finds persisted credentials by username', async () => {
      const userData: User = buildUser();
      const user: User = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
        password: 'hashed-password',
      });

      const credentials: UserCredentials | null =
        await userRepository.findCredentialsByIdentifier(user.username);

      expect(credentials).toMatchObject({
        authSession: { user: { id: user.id } },
        passwordHash: 'hashed-password',
      });
    });
  });

  describe('findByIdentifier', () => {
    it('finds a user by username', async () => {
      const userData: User = buildUser();
      const user: User = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
      });

      const byUsername: User | null =
        await userRepository.findByIdentifier('host');

      expect(byUsername).toMatchObject({
        id: user.id,
        email: 'host@cityborn.test',
      });
    });
  });

  describe('findByIdentifiers', () => {
    it('finds an existing user by either username or email', async () => {
      const userData: User = buildUser();
      const unusedUser: User = buildUser({ username: 'unused' });
      await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
      });

      const byUsername: Pick<User, 'username' | 'email'> | null =
        await userRepository.findByIdentifiers(
          userData.username,
          'unused@cityborn.test',
        );
      const byEmail: Pick<User, 'username' | 'email'> | null =
        await userRepository.findByIdentifiers(
          unusedUser.username,
          'host@cityborn.test',
        );

      expect(byUsername).toEqual({
        username: 'host',
        email: 'host@cityborn.test',
      });
      expect(byEmail).toEqual({
        username: 'host',
        email: 'host@cityborn.test',
      });
    });
  });

  describe('existsByUsername', () => {
    it('distinguishes an existing username from an unused one', async () => {
      const userData: User = buildUser();
      await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
      });

      const exists: boolean = await userRepository.existsByUsername(
        userData.username,
      );
      const absent: boolean = await userRepository.existsByUsername('unused');

      expect(exists).toBe(true);
      expect(absent).toBe(false);
    });
  });

  describe('findByAppleId', () => {
    it('finds an account by Apple identifier', async () => {
      const userData: User = buildUser();
      const user: User = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
        appleId: 'apple-user-123',
      });

      const found: User | null =
        await userRepository.findByAppleId('apple-user-123');

      expect(found).toMatchObject({ id: user.id, email: 'host@cityborn.test' });
    });
  });

  describe('updateUsername', () => {
    it('persists the new username', async () => {
      const userData: User = buildUser();
      const user: User = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
      });

      const updated: User = await userRepository.updateUsername(
        user.id,
        UsernameSchema.parse('citizen'),
      );

      expect(updated.username).toBe('citizen');
      expect(await userRepository.findById(user.id)).toMatchObject({
        username: 'citizen',
      });
    });
  });

  describe('findCredentialsByEmail', () => {
    it.each(['ali_e@example.com', 'a%lice@example.com'])(
      'does not interpret pattern characters in %s as email wildcards',
      async (email: string) => {
        const user: User = buildUser({ email: 'alice@example.com' });
        await userRepository.create({
          email: user.email,
          username: user.username,
          type: 'email',
          password: 'hash',
        });

        const credentials: UserCredentials | null =
          await userRepository.findCredentialsByEmail(email);

        expect(credentials).toBeNull();
      },
    );

    it('finds a literal underscore despite casing without matching another address', async () => {
      const user: User = buildUser({ email: 'Alice_1@Example.com' });
      const otherUser: User = buildUser({
        email: 'AliceX1@Example.com',
        username: 'other',
      });
      await userRepository.create({
        email: user.email,
        username: user.username,
        type: 'email',
        password: 'literal-hash',
      });
      await userRepository.create({
        email: otherUser.email,
        username: otherUser.username,
        type: 'email',
        password: 'other-hash',
      });

      const credentials: UserCredentials | null =
        await userRepository.findCredentialsByEmail('alice_1@example.com');

      expect(credentials).toMatchObject({
        passwordHash: 'literal-hash',
        authSession: { user: { email: 'Alice_1@Example.com' } },
      });
    });

    it('finds credentials despite email casing and preserves the stored address', async () => {
      const user: User = buildUser({ email: 'Alice@Example.com' });
      await userRepository.create({
        email: user.email,
        username: user.username,
        type: 'email',
        password: 'hash',
      });

      const credentials: UserCredentials | null =
        await userRepository.findCredentialsByEmail('alice@example.com');

      expect(credentials).toMatchObject({
        passwordHash: 'hash',
        authSession: { user: { email: 'Alice@Example.com' } },
      });
    });

    it('retains exact matches and refuses an ambiguous case-insensitive fallback', async () => {
      const first: User = buildUser({ email: 'Alice@Example.com' });
      const second: User = buildUser({
        email: 'ALICE@EXAMPLE.COM',
        username: 'second',
      });
      await userRepository.create({
        email: first.email,
        username: first.username,
        type: 'email',
        password: 'first-hash',
      });
      await userRepository.create({
        email: second.email,
        username: second.username,
        type: 'email',
        password: 'second-hash',
      });

      expect(
        await userRepository.findCredentialsByEmail('Alice@Example.com'),
      ).toMatchObject({ passwordHash: 'first-hash' });
      expect(
        await userRepository.findCredentialsByEmail('ALICE@EXAMPLE.COM'),
      ).toMatchObject({ passwordHash: 'second-hash' });
      expect(
        await userRepository.findCredentialsByEmail('alice@example.com'),
      ).toBeNull();
    });

    it('matches only the email and retains unverified credentials', async () => {
      const user: User = buildUser({ isVerified: false });
      await userRepository.create({
        email: user.email,
        username: user.username,
        type: 'email',
        password: 'hash',
      });

      expect(
        await userRepository.findCredentialsByEmail(user.email),
      ).toMatchObject({
        passwordHash: 'hash',
        authSession: { user: { email: user.email, isVerified: false } },
      });
      expect(
        await userRepository.findCredentialsByEmail(user.username),
      ).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('persists the new password hash', async () => {
      const userData: User = buildUser();
      const user: User = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
        password: 'old-hash',
      });

      await userRepository.updatePassword(user.id, 'new-hash');
      const credentials: UserCredentials | null =
        await userRepository.findCredentialsById(user.id);

      expect(credentials).toMatchObject({
        authSession: { user: { id: user.id }, authVersion: 0 },
        passwordHash: 'new-hash',
      });
    });
  });

  describe('markEmailVerified', () => {
    it('persists email verification', async () => {
      const userData: User = buildUser({ isVerified: false });
      const user: User = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
        isVerified: userData.isVerified,
      });

      const verified: User = await userRepository.markEmailVerified(user.id);

      expect(verified.isVerified).toBe(true);
      expect(await userRepository.findById(user.id)).toMatchObject({
        isVerified: true,
      });
    });
  });

  describe('incrementAuthVersion', () => {
    it('increments and returns the persisted auth version', async () => {
      const userData: User = buildUser();
      const user: User = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
      });

      const firstVersion: number = await userRepository.incrementAuthVersion(
        user.id,
      );
      const secondVersion: number = await userRepository.incrementAuthVersion(
        user.id,
      );
      const authSession: AuthSession | null =
        await userRepository.findAuthSessionById(user.id);

      expect(firstVersion).toBe(1);
      expect(secondVersion).toBe(2);
      expect(authSession?.authVersion).toBe(2);
    });
  });

  describe('reclaimUnverifiedAccount', () => {
    it('hands an unverified account over to its identity provider owner', async () => {
      const userData: User = buildUser({ isVerified: false });
      const user: User = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: 'email',
        password: 'squatter-hash',
        isVerified: userData.isVerified,
      });

      const authSession: AuthSession =
        await userRepository.reclaimUnverifiedAccount({
          userId: user.id,
          type: 'apple',
          appleId: 'apple-user-1',
        });
      const credentials: UserCredentials | null =
        await userRepository.findCredentialsById(user.id);

      expect(authSession).toMatchObject({
        user: { id: user.id, type: 'apple', isVerified: true },
        authVersion: 1,
      });
      expect(credentials?.passwordHash).toBeNull();
      expect(await userRepository.findByAppleId('apple-user-1')).toMatchObject({
        id: user.id,
      });
    });
  });

  describe('admin role constraint', () => {
    it('rejects the admin role on an unverified account', async () => {
      const userData: User = buildUser({ isVerified: false });
      const user: User = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
        isVerified: userData.isVerified,
      });

      await expect(
        infrastructure.prisma.user.update({
          where: { id: user.id },
          data: { role: 'admin' },
        }),
      ).rejects.toThrow('User_admin_requires_verified_email');
    });
  });
});
