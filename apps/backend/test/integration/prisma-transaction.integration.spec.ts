import { createHash } from 'node:crypto';
import type {
  Category,
  CreateCategory,
  CreateWorldLocation,
  GuessObject,
  GuessObjectId,
  ResetPassword,
  UpdateCategory,
  User,
  WorldLocation,
} from '@cityborn/api';
import {
  buildCreateCategory,
  buildGuessObject,
  buildUpdateCategory,
  buildUser,
  buildWorldLocation,
  CreateWorldLocationSchema,
  ErrorCode,
} from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import type { User as PrismaUser } from '@prisma/client';
import { compare } from 'bcrypt';
import { PASSWORD_RESET_REPOSITORY } from '../../src/auth/repositories/password-reset.repository';
import { PrismaPasswordResetRepository } from '../../src/auth/repositories/prisma-password-reset.repository';
import { PasswordResetService } from '../../src/auth/services/password-reset.service';
import { CATEGORY_REPOSITORY } from '../../src/category/repositories/category.repository';
import { PrismaCategoryRepository } from '../../src/category/repositories/prisma-category.repository';
import { CategoryService } from '../../src/category/services/category.service';
import { WideEventService } from '../../src/common/wide-event/wide-event.service';
import { HTTP_CONFIG, type HttpConfig } from '../../src/config/config.module';
import { GameRecordService } from '../../src/game-record/game-record.service';
import { GuessObjectService } from '../../src/guess-object/guess-object.service';
import { GUESS_OBJECT_REPOSITORY } from '../../src/guess-object/repositories/guess-object.repository';
import { PrismaGuessObjectRepository } from '../../src/guess-object/repositories/prisma-guess-object.repository';
import { MailService } from '../../src/mail/mail.service';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { RateLimitService } from '../../src/rate-limit/rate-limit.service';
import { RedisService } from '../../src/redis/redis.service';
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY } from '../../src/user/repositories/email-verification-token.repository';
import { PrismaEmailVerificationTokenRepository } from '../../src/user/repositories/prisma-email-verification-token.repository';
import { PrismaUserRepository } from '../../src/user/repositories/prisma-user.repository';
import { USER_REPOSITORY } from '../../src/user/repositories/user.repository';
import { UserService } from '../../src/user/user.service';
import { PrismaWorldLocationRepository } from '../../src/world-location/repositories/prisma-world-location.repository';
import { WORLD_LOCATION_REPOSITORY } from '../../src/world-location/repositories/world-location.repository';
import { WorldLocationService } from '../../src/world-location/world-location.service';
import { AuthenticatedSocketService } from '../../src/ws-handshake/authenticated-socket.service';
import { createTestInfrastructure } from '../support/infrastructure';

describe('Prisma transactions', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
  const rateLimitService: RateLimitService = new RateLimitService(
    new RedisService(infrastructure.redis, createMock<WideEventService>()),
  );
  let module: TestingModule;
  let categoryRepository: PrismaCategoryRepository;
  let categoryService: CategoryService;
  let guessObjectRepository: PrismaGuessObjectRepository;
  let worldLocationRepository: PrismaWorldLocationRepository;
  let tokenRepository: PrismaEmailVerificationTokenRepository;
  let userRepository: PrismaUserRepository;
  let userService: UserService;
  let passwordResetService: PasswordResetService;

  beforeAll(async () => {
    const httpConfig: HttpConfig = {
      frontendUrl: 'https://cityborn.test',
      backOfficeOrigin: 'https://admin.cityborn.test',
      corsOrigins: [],
    };
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [
        PasswordResetService,
        {
          provide: PASSWORD_RESET_REPOSITORY,
          useClass: PrismaPasswordResetRepository,
        },
        { provide: RateLimitService, useValue: rateLimitService },
        {
          provide: MailService,
          useValue: createMock<MailService>({
            sendMail: jest.fn().mockResolvedValue(undefined),
          }),
        },
        { provide: WideEventService, useValue: createMock<WideEventService>() },
        {
          provide: AuthenticatedSocketService,
          useValue: createMock<AuthenticatedSocketService>(),
        },
        {
          provide: HTTP_CONFIG,
          useValue: httpConfig,
        },
        CategoryService,
        GuessObjectService,
        WorldLocationService,
        UserService,
        {
          provide: GameRecordService,
          useValue: createMock<GameRecordService>(),
        },
        { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
        {
          provide: GUESS_OBJECT_REPOSITORY,
          useClass: PrismaGuessObjectRepository,
        },
        {
          provide: WORLD_LOCATION_REPOSITORY,
          useClass: PrismaWorldLocationRepository,
        },
        {
          provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
          useClass: PrismaEmailVerificationTokenRepository,
        },
        { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
      ],
    }).compile();
    await module.init();
    categoryRepository = module.get(CATEGORY_REPOSITORY);
    categoryService = module.get(CategoryService);
    guessObjectRepository = module.get(GUESS_OBJECT_REPOSITORY);
    worldLocationRepository = module.get(WORLD_LOCATION_REPOSITORY);
    tokenRepository = module.get(EMAIL_VERIFICATION_TOKEN_REPOSITORY);
    userRepository = module.get(USER_REPOSITORY);
    userService = module.get(UserService);
    passwordResetService = module.get(PasswordResetService);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  describe('CategoryService', () => {
    describe('update', () => {
      it('rolls back relation and object deletion when location cleanup fails', async () => {
        const locationData: WorldLocation = buildWorldLocation();
        const createLocationData: CreateWorldLocation =
          CreateWorldLocationSchema.parse(locationData);
        const location: WorldLocation =
          await worldLocationRepository.create(createLocationData);
        const guessObject: GuessObject = buildGuessObject();
        const guessObjectId: GuessObjectId = await guessObjectRepository.create(
          {
            name: guessObject.name,
            image: guessObject.image,
            description: guessObject.description,
            short_description: guessObject.short_description,
            source: guessObject.source,
            world_location_id: location.id,
          },
        );
        const categoryData: CreateCategory = buildCreateCategory({
          guessObjectsIds: [guessObjectId],
        });
        const category: Category =
          await categoryRepository.create(categoryData);
        const updateData: UpdateCategory = buildUpdateCategory({
          id: category.id,
          name: 'Changed',
          disconnectIds: [guessObjectId],
        });
        jest
          .spyOn(worldLocationRepository, 'delete')
          .mockRejectedValueOnce(new Error('location cleanup failed'));

        await expect(
          categoryService.update(category.id, updateData),
        ).rejects.toThrow('location cleanup failed');

        expect(
          await prisma.category.findUnique({
            where: { id: category.id },
            include: { guessObjects: true },
          }),
        ).toMatchObject({
          name: 'Monuments',
          guessObjects: [{ id: guessObjectId }],
        });
        expect(
          await prisma.guessObject.count({ where: { id: guessObjectId } }),
        ).toBe(1);
        expect(
          await prisma.worldLocation.count({ where: { id: location.id } }),
        ).toBe(1);
      });
    });
  });

  describe('UserService', () => {
    describe('verifyEmail', () => {
      it('keeps a user unverified and retains the token when token cleanup fails', async () => {
        const userData: User = buildUser({ isVerified: false });
        const user: User = await userRepository.create({
          email: userData.email,
          username: userData.username,
          type: userData.type,
          isVerified: userData.isVerified,
        });
        await tokenRepository.createVerificationToken({
          userId: user.id,
          token: 'verification-token',
          expiresAt: new Date('2099-01-01'),
        });
        jest
          .spyOn(tokenRepository, 'deleteVerificationTokensByUserId')
          .mockRejectedValueOnce(new Error('token cleanup failed'));

        await expect(
          userService.verifyEmail('verification-token'),
        ).rejects.toThrow('token cleanup failed');

        expect(
          await prisma.user.findUnique({ where: { id: user.id } }),
        ).toMatchObject({ isVerified: false });
        expect(
          await prisma.emailVerificationToken.count({
            where: { userId: user.id },
          }),
        ).toBe(1);
      });
    });
  });
  describe('PasswordResetService', () => {
    describe('reset', () => {
      it('rolls back token consumption and the password when auth version increment fails', async () => {
        const user: User = buildUser({ isVerified: false });
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            username: user.username,
            isVerified: user.isVerified,
            type: 'email',
            password: 'old-hash',
          },
        });
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: createHash('sha256').update('token').digest('hex'),
            expiresAt: new Date('2099-01-01'),
          },
        });
        jest
          .spyOn(userRepository, 'incrementAuthVersion')
          .mockRejectedValueOnce(new Error('write failed'));

        const data: ResetPassword = {
          token: 'token',
          password: 'NewPass1',
          confirmPassword: 'NewPass1',
        };

        await expect(passwordResetService.reset(data)).rejects.toThrow(
          'write failed',
        );

        expect(
          await prisma.user.findUnique({ where: { id: user.id } }),
        ).toMatchObject({
          password: 'old-hash',
          authVersion: 0,
          isVerified: false,
        });
        expect(
          await prisma.passwordResetToken.findUnique({
            where: { userId: user.id },
          }),
        ).toEqual({
          userId: user.id,
          tokenHash: createHash('sha256').update('token').digest('hex'),
          expiresAt: new Date('2099-01-01'),
        });
      });

      it('commits one password update and auth version increment during concurrent resets', async () => {
        const user: User = buildUser({ isVerified: false });
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            username: user.username,
            isVerified: user.isVerified,
            type: 'email',
            password: 'old-hash',
          },
        });
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: createHash('sha256').update('token').digest('hex'),
            expiresAt: new Date('2099-01-01'),
          },
        });

        const firstReset: ResetPassword = {
          token: 'token',
          password: 'NewPass1',
          confirmPassword: 'NewPass1',
        };
        const secondReset: ResetPassword = {
          token: 'token',
          password: 'OtherPass1',
          confirmPassword: 'OtherPass1',
        };

        const results: PromiseSettledResult<void>[] = await Promise.allSettled([
          passwordResetService.reset(firstReset),
          passwordResetService.reset(secondReset),
        ]);

        expect(
          results.filter((result) => result.status === 'fulfilled'),
        ).toHaveLength(1);
        expect(
          results.filter((result) => result.status === 'rejected'),
        ).toEqual([
          expect.objectContaining({
            reason: expect.objectContaining({
              status: 401,
              response: expect.objectContaining({
                code: ErrorCode.USER_PASSWORD_RESET_INVALID_TOKEN,
              }),
            }),
          }),
        ]);
        const successfulResetIndex: number = results.findIndex(
          (result) => result.status === 'fulfilled',
        );
        const updatedUser: PrismaUser | null = await prisma.user.findUnique({
          where: { id: user.id },
        });
        expect(updatedUser).toMatchObject({
          authVersion: 1,
          isVerified: false,
        });
        expect(
          await compare(
            successfulResetIndex === 0
              ? firstReset.password
              : secondReset.password,
            updatedUser?.password ?? '',
          ),
        ).toBe(true);
        expect(await prisma.passwordResetToken.count()).toBe(0);
      });

      it('clears the sign-in lock after committing while preserving reset quotas', async () => {
        const user: User = buildUser({ isVerified: false });
        const data: ResetPassword = {
          token: 'token',
          password: 'NewPass1',
          confirmPassword: 'NewPass1',
        };
        const emailHash: string = createHash('sha256')
          .update(user.email)
          .digest('hex');
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            username: user.username,
            type: 'email',
            password: 'old-hash',
            isVerified: user.isVerified,
          },
        });
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: createHash('sha256').update(data.token).digest('hex'),
            expiresAt: new Date('2099-01-01'),
          },
        });
        await Promise.all(
          Array.from({ length: 10 }, () =>
            rateLimitService.recordFailedSignIn(user.id),
          ),
        );
        await rateLimitService.consumePasswordReset('reset-ip');
        await rateLimitService.reservePasswordResetEmail(emailHash);
        await expect(
          rateLimitService.assertSignInAllowed(user.id),
        ).rejects.toMatchObject({ status: 429 });

        await passwordResetService.reset(data);

        await expect(
          rateLimitService.assertSignInAllowed(user.id),
        ).resolves.toBeUndefined();
        expect(
          await infrastructure.redis.exists(
            `rl:password-reset:email:${emailHash}`,
          ),
        ).toBe(1);
        expect(
          await infrastructure.redis.exists('rl:password-reset:ip:reset-ip'),
        ).toBe(1);
        expect(
          await prisma.user.findUnique({ where: { id: user.id } }),
        ).toMatchObject({ authVersion: 1 });
      });
    });
  });
});
