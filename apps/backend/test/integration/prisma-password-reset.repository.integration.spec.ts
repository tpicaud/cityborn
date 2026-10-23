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
      await passwordResetRepository.replaceToken({
        userId: user.id,
        tokenHash: 'old-hash',
        expiresAt: new Date('2099-01-01'),
      });

      await passwordResetRepository.replaceToken({
        userId: user.id,
        tokenHash: 'new-hash',
        expiresAt: new Date('2099-01-02'),
      });

      expect(
        await passwordResetRepository.consumeToken({
          tokenHash: 'old-hash',
          now: new Date(),
        }),
      ).toBeNull();
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
      await passwordResetRepository.replaceToken({
        userId: user.id,
        tokenHash: 'hash',
        expiresAt: new Date('2099-01-01'),
      });

      const results: (UserId | null)[] = await Promise.all([
        passwordResetRepository.consumeToken({
          tokenHash: 'hash',
          now: new Date(),
        }),
        passwordResetRepository.consumeToken({
          tokenHash: 'hash',
          now: new Date(),
        }),
      ]);

      expect(results.filter(Boolean)).toEqual([user.id]);
      expect(
        await passwordResetRepository.consumeToken({
          tokenHash: 'hash',
          now: new Date(),
        }),
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
      await passwordResetRepository.replaceToken({
        userId: user.id,
        tokenHash: 'hash',
        expiresAt: expiration,
      });

      expect(
        await passwordResetRepository.consumeToken({
          tokenHash: 'hash',
          now: expiration,
        }),
      ).toBeNull();
    });
  });
});
