import type {
  CreatePack,
  CreateWorldLocation,
  GuessObject,
  GuessObjectId,
  Pack,
  UpdatePack,
  User,
  WorldLocation,
} from '@cityborn/api';
import {
  buildCreatePack,
  buildGuessObject,
  buildUpdatePack,
  buildUser,
  buildWorldLocation,
  CreateWorldLocationSchema,
} from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { GuessObjectService } from '../../src/guess-object/guess-object.service';
import { GUESS_OBJECT_REPOSITORY } from '../../src/guess-object/repositories/guess-object.repository';
import { PrismaGuessObjectRepository } from '../../src/guess-object/repositories/prisma-guess-object.repository';
import { PACK_REPOSITORY } from '../../src/pack/repositories/pack.repository';
import { PrismaPackRepository } from '../../src/pack/repositories/prisma-pack.repository';
import { PackService } from '../../src/pack/services/pack.service';
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
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
  let module: TestingModule;
  let packRepository: PrismaPackRepository;
  let packService: PackService;
  let guessObjectRepository: PrismaGuessObjectRepository;
  let worldLocationRepository: PrismaWorldLocationRepository;
  let tokenRepository: PrismaEmailVerificationTokenRepository;
  let userRepository: PrismaUserRepository;
  let userService: UserService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [
        PackService,
        GuessObjectService,
        WorldLocationService,
        UserService,
        { provide: PACK_REPOSITORY, useClass: PrismaPackRepository },
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
    packRepository = module.get(PACK_REPOSITORY);
    packService = module.get(PackService);
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

  describe('PackService', () => {
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
        const packData: CreatePack = buildCreatePack({
          guessObjectsIds: [guessObjectId],
        });
        const pack: Pack = await packRepository.create(packData);
        const updateData: UpdatePack = buildUpdatePack({
          id: pack.id,
          name: 'Changed',
          disconnectIds: [guessObjectId],
        });
        jest
          .spyOn(worldLocationRepository, 'delete')
          .mockRejectedValueOnce(new Error('location cleanup failed'));

        await expect(packService.update(pack.id, updateData)).rejects.toThrow(
          'location cleanup failed',
        );

        expect(
          await prisma.pack.findUnique({
            where: { id: pack.id },
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
});
