import {
  buildCreateCategory,
  buildGuessObject,
  buildUpdateCategory,
  buildWorldLocation,
  CreateWorldLocationSchema,
} from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { CATEGORY_REPOSITORY } from '../../src/category/repositories/category.repository';
import { PrismaCategoryRepository } from '../../src/category/repositories/prisma-category.repository';
import { CategoryService } from '../../src/category/services/category.service';
import { GuessObjectService } from '../../src/guess-object/guess-object.service';
import { GUESS_OBJECT_REPOSITORY } from '../../src/guess-object/repositories/guess-object.repository';
import { PrismaGuessObjectRepository } from '../../src/guess-object/repositories/prisma-guess-object.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { PrismaWorldLocationRepository } from '../../src/world-location/repositories/prisma-world-location.repository';
import { WORLD_LOCATION_REPOSITORY } from '../../src/world-location/repositories/world-location.repository';
import { WorldLocationService } from '../../src/world-location/world-location.service';
import { createTestInfrastructure } from '../support/infrastructure';

describe('CategoryService transaction', () => {
  const infrastructure = createTestInfrastructure();
  const { prisma } = infrastructure;
  let module: TestingModule;
  let categoryRepository: PrismaCategoryRepository;
  let categoryService: CategoryService;
  let guessObjectRepository: PrismaGuessObjectRepository;
  let worldLocationRepository: PrismaWorldLocationRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [
        CategoryService,
        GuessObjectService,
        WorldLocationService,
        { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
        {
          provide: GUESS_OBJECT_REPOSITORY,
          useClass: PrismaGuessObjectRepository,
        },
        {
          provide: WORLD_LOCATION_REPOSITORY,
          useClass: PrismaWorldLocationRepository,
        },
      ],
    }).compile();
    await module.init();
    categoryRepository = module.get(CATEGORY_REPOSITORY);
    categoryService = module.get(CategoryService);
    guessObjectRepository = module.get(GUESS_OBJECT_REPOSITORY);
    worldLocationRepository = module.get(WORLD_LOCATION_REPOSITORY);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  async function seedCategoryWithGuessObject() {
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
    return { category, guessObjectId, location };
  }

  it('commits relation and orphan cleanup together', async () => {
    const { category, guessObjectId, location } =
      await seedCategoryWithGuessObject();

    await categoryService.update(
      category.id,
      buildUpdateCategory({ id: category.id, disconnectIds: [guessObjectId] }),
    );

    expect(
      await prisma.category.findUnique({
        where: { id: category.id },
        include: { guessObjects: true },
      }),
    ).toMatchObject({ guessObjects: [] });
    expect(
      await prisma.guessObject.count({ where: { id: guessObjectId } }),
    ).toBe(0);
    expect(
      await prisma.worldLocation.count({ where: { id: location.id } }),
    ).toBe(0);
  });

  it('rolls back relation and object deletion when location cleanup fails', async () => {
    const { category, guessObjectId, location } =
      await seedCategoryWithGuessObject();
    jest
      .spyOn(worldLocationRepository, 'delete')
      .mockRejectedValueOnce(new Error('location cleanup failed'));

    await expect(
      categoryService.update(
        category.id,
        buildUpdateCategory({
          id: category.id,
          name: 'Changed',
          disconnectIds: [guessObjectId],
        }),
      ),
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
