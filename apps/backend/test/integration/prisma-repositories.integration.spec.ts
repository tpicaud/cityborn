import {
  buildCreateCategory,
  buildCreateGameRecord,
  buildGuessObject,
  buildUpdateCategory,
  buildUser,
  buildWorldLocation,
  CreateWorldLocationSchema,
  type GameRecordId,
} from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaCategoryRepository } from '../../src/category/repositories/prisma-category.repository';
import { PrismaGameRecordRepository } from '../../src/game-record/repositories/prisma-game-record.repository';
import { PrismaGuessObjectRepository } from '../../src/guess-object/repositories/prisma-guess-object.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { PrismaEmailVerificationTokenRepository } from '../../src/user/repositories/prisma-email-verification-token.repository';
import { PrismaUserRepository } from '../../src/user/repositories/prisma-user.repository';
import { PrismaWorldLocationRepository } from '../../src/world-location/repositories/prisma-world-location.repository';
import { createTestInfrastructure } from '../support/infrastructure';

describe('Prisma repositories', () => {
  const infrastructure = createTestInfrastructure();
  const { prisma } = infrastructure;
  let module: TestingModule;
  let categoryRepository: PrismaCategoryRepository;
  let gameRecordRepository: PrismaGameRecordRepository;
  let guessObjectRepository: PrismaGuessObjectRepository;
  let tokenRepository: PrismaEmailVerificationTokenRepository;
  let userRepository: PrismaUserRepository;
  let worldLocationRepository: PrismaWorldLocationRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [
        PrismaCategoryRepository,
        PrismaGameRecordRepository,
        PrismaGuessObjectRepository,
        PrismaEmailVerificationTokenRepository,
        PrismaUserRepository,
        PrismaWorldLocationRepository,
      ],
    }).compile();
    await module.init();
    categoryRepository = module.get(PrismaCategoryRepository);
    gameRecordRepository = module.get(PrismaGameRecordRepository);
    guessObjectRepository = module.get(PrismaGuessObjectRepository);
    tokenRepository = module.get(PrismaEmailVerificationTokenRepository);
    userRepository = module.get(PrismaUserRepository);
    worldLocationRepository = module.get(PrismaWorldLocationRepository);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  it('persists geometry and finds a location by OSM identifier', async () => {
    const data = CreateWorldLocationSchema.parse(buildWorldLocation());

    const location = await worldLocationRepository.create(data);
    const found = await worldLocationRepository.findBySource(
      { provider: 'relation', external_id: '7444' },
      { geometry: true },
    );

    expect(found).toMatchObject({
      id: location.id,
      name: 'Paris',
      centroid: [48.8566, 2.3522],
      geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
    });
    expect(
      await prisma.worldLocationGeometry.count({
        where: { world_location_id: location.id },
      }),
    ).toBe(1);
  });

  it('cascades geometry deletion when its location is removed', async () => {
    const location = await worldLocationRepository.create(
      CreateWorldLocationSchema.parse(buildWorldLocation()),
    );

    await worldLocationRepository.delete(location.id);

    expect(
      await worldLocationRepository.findById(location.id, { geometry: true }),
    ).toBeNull();
    expect(await prisma.worldLocationGeometry.count()).toBe(0);
  });

  it('rejects duplicate OSM identifiers', async () => {
    const data = CreateWorldLocationSchema.parse(buildWorldLocation());
    await worldLocationRepository.create(data);

    await expect(
      worldLocationRepository.create({ ...data, name: 'Another city' }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('persists category and guess object relations across connect and disconnect', async () => {
    const location = await worldLocationRepository.create(
      CreateWorldLocationSchema.parse(buildWorldLocation()),
    );
    const guessObject = buildGuessObject();
    const guessObjectId = await guessObjectRepository.create({
      name: guessObject.name,
      image: guessObject.image,
      description: guessObject.description,
      short_description: guessObject.short_description,
      source: guessObject.source,
      world_location_id: location.id,
    });

    const category = await categoryRepository.create(
      buildCreateCategory({ guessObjectsIds: [guessObjectId] }),
    );
    const categories = await categoryRepository.findFullBy({
      ids: [category.id],
    });
    const guessObjects = await guessObjectRepository.findFullBy({
      categoryIds: [category.id],
    });

    expect(categories[0]?.guessObjects.map(({ id }) => id)).toEqual([
      guessObjectId,
    ]);
    expect(guessObjects.map(({ id }) => id)).toEqual([guessObjectId]);
    expect(guessObjects[0]?.world_location.geometry).toEqual({
      type: 'Point',
      coordinates: [2.3522, 48.8566],
    });

    await categoryRepository.update(
      category.id,
      buildUpdateCategory({ id: category.id, disconnectIds: [guessObjectId] }),
    );

    expect(await categoryRepository.countByGuessObjectId(guessObjectId)).toBe(
      0,
    );
    expect(
      (await categoryRepository.findFullBy({ ids: [category.id] }))[0]
        ?.guessObjects,
    ).toEqual([]);
  });

  it('loads nested categories beneath published roots', async () => {
    const root = await categoryRepository.create(
      buildCreateCategory({ name: 'Countries', isPublished: true }),
    );
    const child = await categoryRepository.create(
      buildCreateCategory({ name: 'France', parentId: root.id }),
    );
    await categoryRepository.create(
      buildCreateCategory({ name: 'Hidden', isPublished: false }),
    );

    const tree = await categoryRepository.findTree({ isPublished: true });

    expect(tree).toMatchObject([
      { id: root.id, name: 'Countries', children: [{ id: child.id }] },
    ]);
  });

  it('finds user credentials and verification tokens through persisted identifiers', async () => {
    const userData = buildUser({ isVerified: false });
    const user = await userRepository.create({
      email: userData.email,
      username: userData.username,
      type: userData.type,
      isVerified: userData.isVerified,
      password: 'hashed-password',
    });
    const expiresAt = new Date('2099-01-01');
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: 'older-token',
        expiresAt: new Date('2098-01-01'),
        createdAt: new Date('2026-01-01'),
      },
    });

    await tokenRepository.createVerificationToken({
      userId: user.id,
      token: 'verification-token',
      expiresAt,
    });

    expect(
      await userRepository.findCredentialsByIdentifier('host@cityborn.test'),
    ).toMatchObject({
      user: { id: user.id, username: 'host', isVerified: false },
      passwordHash: 'hashed-password',
    });
    expect(await userRepository.findByIdentifier('host')).toMatchObject({
      id: user.id,
      email: 'host@cityborn.test',
    });
    expect(
      await tokenRepository.findLatestVerificationToken(user.id),
    ).toMatchObject({
      userId: user.id,
      expiresAt,
    });
    expect(
      await tokenRepository.findVerificationToken('verification-token'),
    ).toMatchObject({
      userId: user.id,
    });
  });

  it('returns only the five newest game records of the requested user', async () => {
    const firstUserData = buildUser();
    const otherUserData = buildUser({
      username: 'guest',
      email: 'guest@cityborn.test',
    });
    const user = await userRepository.create({
      email: firstUserData.email,
      username: firstUserData.username,
      type: firstUserData.type,
    });
    const otherUser = await userRepository.create({
      email: otherUserData.email,
      username: otherUserData.username,
      type: otherUserData.type,
    });
    const recordIds: GameRecordId[] = [];
    for (let index = 0; index < 6; index++) {
      const record = await gameRecordRepository.create(
        buildCreateGameRecord(),
        [{ id: user.id }],
      );
      recordIds.push(record.id);
      await prisma.gameRecord.update({
        where: { id: record.id },
        data: { createdAt: new Date(Date.UTC(2026, 0, index + 1)) },
      });
    }

    const records = await gameRecordRepository.findRecentByUserId(user.id);
    const others = await gameRecordRepository.findRecentByUserId(otherUser.id);

    expect(records?.map(({ id }) => id)).toEqual(recordIds.slice(1).reverse());
    expect(records?.[0]?.createdAt).toBe('2026-01-06');
    expect(others).toEqual([]);
  });
});
