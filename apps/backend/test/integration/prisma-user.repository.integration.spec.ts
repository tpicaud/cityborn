import type { User } from '@cityborn/api';
import { buildUser } from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
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
        user: { id: user.id, username: 'host', isVerified: false },
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
        user: { id: user.id },
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
});
