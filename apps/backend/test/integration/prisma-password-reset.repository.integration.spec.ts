import { buildUser, type User, type UserId } from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaPasswordResetRepository } from '../../src/auth/repositories/prisma-password-reset.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaPasswordResetRepository', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
  let testingModule: TestingModule;
  let passwordResetRepository: PrismaPasswordResetRepository;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [PrismaPasswordResetRepository],
    }).compile();
    await testingModule.init();
    passwordResetRepository = testingModule.get(PrismaPasswordResetRepository);
  });
  afterAll(async () => {
    await testingModule?.close();
    await infrastructure.close();
  });

  describe('findEligibleUser', () => {
    it('finds an unverified account by email without matching its username', async () => {
      const user: User = buildUser({ isVerified: false });
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified,
          type: 'email',
          password: 'hash',
        },
      });

      expect(
        await passwordResetRepository.findEligibleUser(user.email),
      ).toMatchObject({
        id: user.id,
        isVerified: false,
      });
      expect(
        await passwordResetRepository.findEligibleUser(user.username),
      ).toBeNull();
    });

    it.each(['google', 'apple'])(
      'excludes a passwordless %s account',
      async (type: string) => {
        const user: User = buildUser();
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            username: user.username,
            isVerified: user.isVerified,
            type,
          },
        });

        expect(
          await passwordResetRepository.findEligibleUser(user.email),
        ).toBeNull();
      },
    );
  });

  describe('replaceToken', () => {
    it('invalidates the previous link and leaves one token per account', async () => {
      const user: User = buildUser();
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified,
          type: 'email',
          password: 'hash',
        },
      });
      await passwordResetRepository.replaceToken(
        user.id,
        'old-hash',
        new Date('2099-01-01'),
      );

      await passwordResetRepository.replaceToken(
        user.id,
        'new-hash',
        new Date('2099-01-02'),
      );

      expect(
        await passwordResetRepository.findTokenUser('old-hash', new Date()),
      ).toBeNull();
      expect(
        await passwordResetRepository.findTokenUser('new-hash', new Date()),
      ).toBe(user.id);
      expect(await prisma.passwordResetToken.count()).toBe(1);
      expect(
        await prisma.passwordResetToken.findUnique({
          where: { userId: user.id },
        }),
      ).toMatchObject({
        tokenHash: 'new-hash',
        expiresAt: new Date('2099-01-02'),
      });
    });
  });

  describe('findTokenUser', () => {
    it('finds the token just before expiration without consuming it', async () => {
      const user: User = buildUser();
      const expiresAt: Date = new Date('2026-01-01T00:00:00.000Z');
      const beforeExpiration: Date = new Date(expiresAt.getTime() - 1);
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified,
          type: 'email',
          password: 'hash',
        },
      });
      await passwordResetRepository.replaceToken(user.id, 'hash', expiresAt);

      const tokenUserId: UserId | null =
        await passwordResetRepository.findTokenUser('hash', beforeExpiration);

      expect(tokenUserId).toBe(user.id);
      expect(
        await passwordResetRepository.consumeToken('hash', beforeExpiration),
      ).toBe(user.id);
    });

    it('rejects the token at its exact expiration', async () => {
      const user: User = buildUser();
      const expiresAt: Date = new Date('2026-01-01T00:00:00.000Z');
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified,
          type: 'email',
          password: 'hash',
        },
      });
      await passwordResetRepository.replaceToken(user.id, 'hash', expiresAt);

      expect(
        await passwordResetRepository.findTokenUser('hash', expiresAt),
      ).toBeNull();
    });
  });

  describe('consumeToken', () => {
    it('allows only one concurrent consumption and rejects replay', async () => {
      const user: User = buildUser();
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified,
          type: 'email',
          password: 'hash',
        },
      });
      await passwordResetRepository.replaceToken(
        user.id,
        'hash',
        new Date('2099-01-01'),
      );

      const results: (UserId | null)[] = await Promise.all([
        passwordResetRepository.consumeToken('hash', new Date()),
        passwordResetRepository.consumeToken('hash', new Date()),
      ]);

      expect(results.filter(Boolean)).toEqual([user.id]);
      expect(
        await passwordResetRepository.consumeToken('hash', new Date()),
      ).toBeNull();
    });

    it('rejects the token at its exact expiration', async () => {
      const user: User = buildUser();
      const expiration: Date = new Date('2026-01-01');
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified,
          type: 'email',
          password: 'hash',
        },
      });
      await passwordResetRepository.replaceToken(user.id, 'hash', expiration);

      expect(
        await passwordResetRepository.consumeToken('hash', expiration),
      ).toBeNull();
    });
  });
});
