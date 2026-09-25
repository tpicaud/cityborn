import { buildUser, type User } from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaPasswordResetRepository } from '../../src/auth/repositories/prisma-password-reset.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaPasswordResetRepository', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
  let module: TestingModule;
  let repository: PrismaPasswordResetRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [PrismaPasswordResetRepository],
    }).compile();
    await module.init();
    repository = module.get(PrismaPasswordResetRepository);
  });
  afterAll(async () => {
    await module?.close();
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
          type: 'email',
          password: 'hash',
        },
      });

      expect(await repository.findEligibleUser(user.email)).toMatchObject({
        id: user.id,
        isVerified: false,
      });
      expect(await repository.findEligibleUser(user.username)).toBeNull();
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
            type,
          },
        });

        expect(await repository.findEligibleUser(user.email)).toBeNull();
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
          type: 'email',
          password: 'hash',
        },
      });
      await repository.replaceToken(
        user.id,
        'old-hash',
        new Date('2099-01-01'),
      );

      await repository.replaceToken(
        user.id,
        'new-hash',
        new Date('2099-01-01'),
      );

      expect(await repository.findTokenUser('old-hash', new Date())).toBeNull();
      expect(await repository.findTokenUser('new-hash', new Date())).toBe(
        user.id,
      );
      expect(await prisma.passwordResetToken.count()).toBe(1);
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
          type: 'email',
          password: 'hash',
        },
      });
      await repository.replaceToken(user.id, 'hash', new Date('2099-01-01'));

      const results = await Promise.all([
        repository.consumeToken('hash', new Date()),
        repository.consumeToken('hash', new Date()),
      ]);

      expect(results.filter(Boolean)).toEqual([user.id]);
      expect(await repository.consumeToken('hash', new Date())).toBeNull();
    });

    it('rejects the token at its exact expiration', async () => {
      const user: User = buildUser();
      const expiration: Date = new Date('2026-01-01');
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          type: 'email',
          password: 'hash',
        },
      });
      await repository.replaceToken(user.id, 'hash', expiration);

      expect(await repository.consumeToken('hash', expiration)).toBeNull();
      expect(await repository.findTokenUser('hash', expiration)).toBeNull();
    });
  });
});
