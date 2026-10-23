import type { User } from '@cityborn/api';
import { buildUser } from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import type { PasswordResetToken as PrismaPasswordResetToken } from '@prisma/client';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import type { PasswordResetToken } from '../../src/user/repositories/password-reset-token.repository';
import { PrismaPasswordResetTokenRepository } from '../../src/user/repositories/prisma-password-reset-token.repository';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaPasswordResetTokenRepository', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
  let module: TestingModule;
  let tokenRepository: PrismaPasswordResetTokenRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [PrismaPasswordResetTokenRepository],
    }).compile();
    await module.init();
    tokenRepository = module.get(PrismaPasswordResetTokenRepository);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  async function persistUser(user: User): Promise<void> {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        type: user.type,
      },
    });
  }

  describe('create', () => {
    it('persists the token hash with its user and expiration', async () => {
      const user: User = buildUser();
      const expiresAt: Date = new Date('2099-01-01');
      await persistUser(user);

      await tokenRepository.create({
        userId: user.id,
        tokenHash: 'token-hash',
        expiresAt,
      });

      const found: PasswordResetToken | null =
        await tokenRepository.findByTokenHash('token-hash');
      expect(found).toMatchObject({ userId: user.id, expiresAt });
    });
  });

  describe('findByTokenHash', () => {
    it('returns null for an unknown hash', async () => {
      const found: PasswordResetToken | null =
        await tokenRepository.findByTokenHash('unknown-hash');

      expect(found).toBeNull();
    });
  });

  describe('delete', () => {
    it('removes only the requested token', async () => {
      const user: User = buildUser();
      await persistUser(user);
      const deletedToken: PrismaPasswordResetToken =
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: 'deleted-hash',
            expiresAt: new Date('2099-01-01'),
          },
        });
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: 'retained-hash',
          expiresAt: new Date('2099-01-01'),
        },
      });

      await tokenRepository.delete(deletedToken.id);

      expect(await tokenRepository.findByTokenHash('deleted-hash')).toBeNull();
      expect(
        await tokenRepository.findByTokenHash('retained-hash'),
      ).toMatchObject({ userId: user.id });
    });
  });

  describe('deleteByUserId', () => {
    it('deletes only the requested user’s tokens', async () => {
      const firstUser: User = buildUser();
      const otherUser: User = buildUser({
        id: '00000000-0000-4000-8000-000000000002',
        email: 'guest@cityborn.test',
        username: 'guest',
      });
      await persistUser(firstUser);
      await persistUser(otherUser);
      await tokenRepository.create({
        userId: firstUser.id,
        tokenHash: 'first-hash',
        expiresAt: new Date('2099-01-01'),
      });
      await tokenRepository.create({
        userId: otherUser.id,
        tokenHash: 'other-hash',
        expiresAt: new Date('2099-01-01'),
      });

      await tokenRepository.deleteByUserId(firstUser.id);

      expect(await tokenRepository.findByTokenHash('first-hash')).toBeNull();
      expect(await tokenRepository.findByTokenHash('other-hash')).toMatchObject(
        { userId: otherUser.id },
      );
    });
  });

  it('is deleted with its user', async () => {
    const user: User = buildUser();
    await persistUser(user);
    await tokenRepository.create({
      userId: user.id,
      tokenHash: 'token-hash',
      expiresAt: new Date('2099-01-01'),
    });

    await prisma.user.delete({ where: { id: user.id } });

    expect(await tokenRepository.findByTokenHash('token-hash')).toBeNull();
  });
});
