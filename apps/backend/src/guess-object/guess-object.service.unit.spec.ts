import type {
  Category,
  CreateGuessObject,
  FullGuessObject,
  GameConfig,
  GuessObject,
  GuessObjectDraft,
  GuessObjectId,
  WorldLocationId,
} from '@cityborn/api';
import {
  buildCategory,
  buildFullGuessObject,
  buildGameConfig,
  buildGuessObject,
  buildGuessObjectDraft,
  ErrorCode,
  GuessObjectIdSchema,
  WorldLocationIdSchema,
} from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { CategoryRepository } from '../category/repositories/category.repository';
import type { WorldLocationService } from '../world-location/world-location.service';
import { GuessObjectService } from './guess-object.service';
import type {
  GuessObjectFilter,
  GuessObjectRepository,
} from './repositories/guess-object.repository';

jest.mock('@nestjs-cls/transactional', () => ({
  Transactional:
    () =>
    (
      _target: object,
      _propertyKey: string | symbol,
      descriptor: PropertyDescriptor,
    ) =>
      descriptor,
}));

const guessObjectId: (value: string) => GuessObjectId = (value: string) =>
  GuessObjectIdSchema.parse(value);
const worldLocationId: (value: string) => WorldLocationId = (value: string) =>
  WorldLocationIdSchema.parse(value);

function buildGuessObjectService() {
  const guessObjectRepository: DeepMocked<GuessObjectRepository> =
    createMock<GuessObjectRepository>();
  const categoryRepository: DeepMocked<CategoryRepository> =
    createMock<CategoryRepository>();
  const worldLocationService: DeepMocked<WorldLocationService> =
    createMock<WorldLocationService>();
  const guessObjectService: GuessObjectService = new GuessObjectService(
    guessObjectRepository,
    categoryRepository,
    worldLocationService,
  );

  return {
    guessObjectService,
    guessObjectRepository,
    categoryRepository,
    worldLocationService,
  };
}

describe('GuessObjectService queries', () => {
  describe('findBy', () => {
    it('delegates filtered queries', async () => {
      const {
        guessObjectService,
        guessObjectRepository,
      }: ReturnType<typeof buildGuessObjectService> = buildGuessObjectService();
      const guessObject: GuessObject = buildGuessObject();
      const filter: GuessObjectFilter = {
        ids: [guessObject.id],
        external_id: 'Q243',
      };
      guessObjectRepository.findBy.mockResolvedValue([guessObject]);

      await expect(guessObjectService.findBy(filter)).resolves.toEqual([
        guessObject,
      ]);
    });
  });

  describe('findShuffledGuessObjectsByGameConfig', () => {
    it('filters configured categories and limits shuffled results', async () => {
      const {
        guessObjectService,
        guessObjectRepository,
      }: ReturnType<typeof buildGuessObjectService> = buildGuessObjectService();
      const objects: FullGuessObject[] = [
        buildFullGuessObject(),
        buildFullGuessObject({ id: 'guess-2' }),
      ];
      guessObjectRepository.findFullBy.mockResolvedValue(objects);
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const category: Category = buildCategory();
      const gameConfig: GameConfig = buildGameConfig({
        categories: [category],
        nbOfObjects: 1,
      });

      const result: FullGuessObject[] =
        await guessObjectService.findShuffledGuessObjectsByGameConfig(
          gameConfig,
        );

      expect(guessObjectRepository.findFullBy).toHaveBeenCalledWith({
        categoryIds: [category.id],
      });
      expect(result).toHaveLength(1);
    });
  });
});

describe('GuessObjectService.create', () => {
  it('rejects an unknown world location', async () => {
    const {
      guessObjectService,
      worldLocationService,
    }: ReturnType<typeof buildGuessObjectService> = buildGuessObjectService();
    const createData: CreateGuessObject = {
      name: 'Eiffel Tower',
      world_location_id: worldLocationId('missing'),
    };
    worldLocationService.get.mockResolvedValue(null);

    await expect(guessObjectService.create(createData)).rejects.toMatchObject({
      response: { code: ErrorCode.BAD_REQUEST },
    });
  });

  it('returns an existing object identifier', async () => {
    const {
      guessObjectService,
      guessObjectRepository,
      worldLocationService,
    }: ReturnType<typeof buildGuessObjectService> = buildGuessObjectService();
    const id: GuessObjectId = guessObjectId('guess-1');
    const createData: CreateGuessObject = {
      name: 'Eiffel Tower',
      world_location_id: worldLocationId('location-1'),
    };
    worldLocationService.get.mockResolvedValue({
      id: worldLocationId('location-1'),
    });
    guessObjectRepository.findByNameAndWorldLocation.mockResolvedValue({ id });

    await expect(guessObjectService.create(createData)).resolves.toBe(id);
    expect(guessObjectRepository.create).not.toHaveBeenCalled();
  });

  it('creates a missing object with its source', async () => {
    const {
      guessObjectService,
      guessObjectRepository,
      worldLocationService,
    }: ReturnType<typeof buildGuessObjectService> = buildGuessObjectService();
    const payload: CreateGuessObject = {
      name: 'Eiffel Tower',
      source: { provider: 'wikidata', external_id: 'Q243' },
      world_location_id: worldLocationId('location-1'),
    };
    worldLocationService.get.mockResolvedValue({
      id: payload.world_location_id,
    });
    guessObjectRepository.findByNameAndWorldLocation.mockResolvedValue(null);
    guessObjectRepository.create.mockResolvedValue(guessObjectId('guess-1'));

    await guessObjectService.create(payload);

    expect(guessObjectRepository.create).toHaveBeenCalledWith(payload);
  });
});

describe('GuessObjectService.delete', () => {
  it('rejects a missing object', async () => {
    const {
      guessObjectService,
      guessObjectRepository,
    }: ReturnType<typeof buildGuessObjectService> = buildGuessObjectService();
    guessObjectRepository.findBy.mockResolvedValue([]);

    await expect(
      guessObjectService.delete(guessObjectId('missing')),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.GUESS_OBJECTS_NOT_FOUND },
    });
  });

  it('rejects an object assigned to a category', async () => {
    const {
      guessObjectService,
      guessObjectRepository,
      categoryRepository,
    }: ReturnType<typeof buildGuessObjectService> = buildGuessObjectService();
    const guessObject: GuessObject = buildGuessObject();
    guessObjectRepository.findBy.mockResolvedValue([guessObject]);
    categoryRepository.countByGuessObjectId.mockResolvedValue(1);

    await expect(
      guessObjectService.delete(guessObjectId('guess-1')),
    ).rejects.toMatchObject({ response: { code: ErrorCode.BAD_REQUEST } });
  });

  it('deletes an orphaned location after the object', async () => {
    const {
      guessObjectService,
      guessObjectRepository,
      categoryRepository,
      worldLocationService,
    }: ReturnType<typeof buildGuessObjectService> = buildGuessObjectService();
    const guessObject: GuessObject = buildGuessObject();
    guessObjectRepository.findBy.mockResolvedValue([guessObject]);
    categoryRepository.countByGuessObjectId.mockResolvedValue(0);
    guessObjectRepository.countByWorldLocationId.mockResolvedValue(0);

    await guessObjectService.delete(guessObject.id);

    expect(worldLocationService.delete).toHaveBeenCalledWith(
      guessObject.world_location_preview.id,
    );
  });
});

describe('GuessObjectService.searchDraftByName', () => {
  it('delegates the search', async () => {
    const {
      guessObjectService,
      guessObjectRepository,
    }: ReturnType<typeof buildGuessObjectService> = buildGuessObjectService();
    const draft: GuessObjectDraft = buildGuessObjectDraft();
    guessObjectRepository.searchDraftByName.mockResolvedValue([draft]);

    await expect(
      guessObjectService.searchDraftByName('tower'),
    ).resolves.toEqual([draft]);
  });
});
