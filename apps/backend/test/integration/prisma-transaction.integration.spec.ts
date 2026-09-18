import {
  buildCreateCategory,
  buildGuessObject,
  buildUpdateCategory,
  buildUser,
  buildWorldLocation,
  CreateWorldLocationSchema,
} from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { CATEGORY_REPOSITORY } from '../../src/category/repositories/category.repository';
import { PrismaCategoryRepository } from '../../src/category/repositories/prisma-category.repository';
import { CategoryService } from '../../src/category/services/category.service';
import { GameRecordService } from '../../src/game-record/game-record.service';
import { GuessObjectService } from '../../src/guess-object/guess-object.service';
import { GUESS_OBJECT_REPOSITORY } from '../../src/guess-object/repositories/guess-object.repository';
import { PrismaGuessObjectRepository } from '../../src/guess-object/repositories/prisma-guess-object.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY } from '../../src/user/repositories/email-verification-token.repository';
import { PrismaEmailVerificationTokenRepository } from '../../src/user/repositories/prisma-email-verification-token.repository';
import { PrismaUserRepository } from '../../src/user/repositories/prisma-user.repository';
import { USER_REPOSITORY } from '../../src/user/repositories/user.repository';
import { UserService } from '../../src/user/user.service';
import { PrismaWorldLocationRepository } from '../../src/world-location/repositories/prisma-world-location.repository';
import { WORLD_LOCATION_REPOSITORY } from '../../src/world-location/repositories/world-location.repository';
import { WorldLocationService } from '../../src/world-location/world-location.service';
import { createTestInfrastructure } from '../support/infrastructure';

describe('Prisma transactions', () => {
  const infrastructure = createTestInfrastructure();
  const { prisma } = infrastructure;
  let module: TestingModule;
  let categoryRepository: PrismaCategoryRepository;
  let categoryService: CategoryService;
  let guessObjectRepository: PrismaGuessObjectRepository;
  let worldLocationRepository: PrismaWorldLocationRepository;
  let tokenRepository: PrismaEmailVerificationTokenRepository;
  let userRepository: PrismaUserRepository;
  let userService: UserService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [
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
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  describe('CategoryService', () => {
    describe('update', () => {
      it('rolls back relation and object deletion when location cleanup fails', async () => {
        const locationData = buildWorldLocation();
        const createLocationData =
          CreateWorldLocationSchema.parse(locationData);
        const location =
          await worldLocationRepository.create(createLocationData);
        const guessObject = buildGuessObject();
        const guessObjectId = await guessObjectRepository.create({
          name: guessObject.name,
          image: guessObject.image,
          description: guessObject.description,
          short_description: guessObject.short_description,
          source: guessObject.source,
          world_location_id: location.id,
        });
        const categoryData = buildCreateCategory({
          guessObjectsIds: [guessObjectId],
        });
        const category = await categoryRepository.create(categoryData);
        const updateData = buildUpdateCategory({
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
        const userData = buildUser({ isVerified: false });
        const user = await userRepository.create({
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
});
