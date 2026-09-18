import type { User } from '@cityborn/api';
import { buildUser } from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import type { EmailVerificationToken } from '../../src/user/repositories/email-verification-token.repository';
import { PrismaEmailVerificationTokenRepository } from '../../src/user/repositories/prisma-email-verification-token.repository';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaEmailVerificationTokenRepository', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
  let module: TestingModule;
  let tokenRepository: PrismaEmailVerificationTokenRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [PrismaEmailVerificationTokenRepository],
    }).compile();
    await module.init();
    tokenRepository = module.get(PrismaEmailVerificationTokenRepository);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  describe('findLatestVerificationToken', () => {
    it('returns the newest verification token for a user', async () => {
      const user: User = buildUser();
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          type: user.type,
        },
      });
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: 'older-token',
          expiresAt: new Date('2098-01-01'),
          createdAt: new Date('2026-01-01'),
        },
      });
      const expiresAt: Date = new Date('2099-01-01');
      await tokenRepository.createVerificationToken({
        userId: user.id,
        token: 'newer-token',
        expiresAt,
      });

      const latest: EmailVerificationToken | null =
        await tokenRepository.findLatestVerificationToken(user.id);

      expect(latest).toMatchObject({ userId: user.id, expiresAt });
    });
  });

  describe('findVerificationToken', () => {
    it('finds a verification token by its unique value', async () => {
      const user: User = buildUser();
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          type: user.type,
        },
      });
      await tokenRepository.createVerificationToken({
        userId: user.id,
        token: 'verification-token',
        expiresAt: new Date('2099-01-01'),
      });

      const found: EmailVerificationToken | null =
        await tokenRepository.findVerificationToken('verification-token');

      expect(found).toMatchObject({ userId: user.id });
    });
  });

  describe('deleteVerificationTokensByUserId', () => {
    it('deletes only the requested user’s tokens', async () => {
      const firstUser: User = buildUser();
      const otherUser: User = buildUser({
        id: '00000000-0000-4000-8000-000000000002',
        email: 'guest@cityborn.test',
        username: 'guest',
      });
      await prisma.user.createMany({
        data: [
          {
            id: firstUser.id,
            email: firstUser.email,
            username: firstUser.username,
            type: firstUser.type,
          },
          {
            id: otherUser.id,
            email: otherUser.email,
            username: otherUser.username,
            type: otherUser.type,
          },
        ],
      });
      await tokenRepository.createVerificationToken({
        userId: firstUser.id,
        token: 'first-token',
        expiresAt: new Date('2099-01-01'),
      });
      await tokenRepository.createVerificationToken({
        userId: otherUser.id,
        token: 'other-token',
        expiresAt: new Date('2099-01-01'),
      });

      await tokenRepository.deleteVerificationTokensByUserId(firstUser.id);

      expect(
        await tokenRepository.findVerificationToken('first-token'),
      ).toBeNull();
      expect(
        await tokenRepository.findVerificationToken('other-token'),
      ).toMatchObject({
        userId: otherUser.id,
      });
    });
  });
});
