import { buildUser } from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { PrismaUserRepository } from '../../src/user/repositories/prisma-user.repository';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaUserRepository', () => {
  const infrastructure = createTestInfrastructure();
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

  describe('PrismaUserRepository.findCredentialsByIdentifier', () => {
    it('finds persisted credentials by email', async () => {
      const userData = buildUser({ isVerified: false });
      const user = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
        isVerified: userData.isVerified,
        password: 'hashed-password',
      });

      const credentials =
        await userRepository.findCredentialsByIdentifier('host@cityborn.test');
      expect(credentials).toMatchObject({
        user: { id: user.id, username: 'host', isVerified: false },
        passwordHash: 'hashed-password',
      });
    });
  });

  describe('PrismaUserRepository.findByIdentifier', () => {
    it('finds a user by username', async () => {
      const userData = buildUser();
      const user = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
      });

      const byUsername = await userRepository.findByIdentifier('host');

      expect(byUsername).toMatchObject({
        id: user.id,
        email: 'host@cityborn.test',
      });
    });
  });

  describe('PrismaUserRepository.findByIdentifiers', () => {
    it('finds an existing user by either username or email', async () => {
      const userData = buildUser();
      await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
      });

      const byUsername = await userRepository.findByIdentifiers(
        userData.username,
        'unused@cityborn.test',
      );
      const byEmail = await userRepository.findByIdentifiers(
        buildUser({ username: 'unused' }).username,
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

  describe('PrismaUserRepository.findByAppleId', () => {
    it('finds an account by Apple identifier', async () => {
      const userData = buildUser();
      const user = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
        appleId: 'apple-user-123',
      });

      const found = await userRepository.findByAppleId('apple-user-123');

      expect(found).toMatchObject({ id: user.id, email: 'host@cityborn.test' });
    });
  });

  describe('PrismaUserRepository.markEmailVerified', () => {
    it('persists email verification', async () => {
      const userData = buildUser({ isVerified: false });
      const user = await userRepository.create({
        email: userData.email,
        username: userData.username,
        type: userData.type,
        isVerified: userData.isVerified,
      });

      const verified = await userRepository.markEmailVerified(user.id);

      expect(verified.isVerified).toBe(true);
      expect(await userRepository.findById(user.id)).toMatchObject({
        isVerified: true,
      });
    });
  });
});
