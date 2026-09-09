import type {
  CreateGuessObject,
  FullGuessObject,
  GameConfig,
  GuessObject,
  GuessObjectDraft,
  GuessObjectId,
  PatchGuessObject,
} from '@cityborn/api';
import { ErrorCode } from '@cityborn/api';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { WorldLocationService } from '../world-location/world-location.service';
import {
  GUESS_OBJECT_REPOSITORY,
  type GuessObjectFilter,
  type GuessObjectRepository,
} from './repositories/guess-object.repository';

@Injectable()
export class GuessObjectService {
  constructor(
    @Inject(GUESS_OBJECT_REPOSITORY)
    private readonly guessObjectRepository: GuessObjectRepository,
    private readonly worldLocationService: WorldLocationService,
  ) {}

  async findBy(filter: GuessObjectFilter): Promise<GuessObject[]> {
    return this.guessObjectRepository.findBy(filter);
  }

  async findFullBy(filter: GuessObjectFilter): Promise<FullGuessObject[]> {
    return this.guessObjectRepository.findFullBy(filter);
  }

  async findShuffledGuessObjectsByGameConfig(
    gameConfig: GameConfig,
  ): Promise<FullGuessObject[]> {
    const allObjects = await this.guessObjectRepository.findFullBy({
      categoryIds: gameConfig.categories?.map((cat) => cat.id),
    });
    const shuffled = allObjects.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, gameConfig.nbOfObjects);
    return selected;
  }

  @Transactional()
  async create(createGuessObject: CreateGuessObject): Promise<GuessObjectId> {
    const worldLocation = await this.worldLocationService.get(
      createGuessObject.world_location_id,
    );
    if (!worldLocation) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `World location ${createGuessObject.world_location_id} not found`,
      });
    }

    const existingGuessObject =
      await this.guessObjectRepository.findByNameAndWorldLocation(
        createGuessObject.name,
        createGuessObject.world_location_id,
      );
    if (existingGuessObject) {
      return existingGuessObject.id;
    }

    return this.guessObjectRepository.create(createGuessObject);
  }

  async update(
    id: GuessObjectId,
    updatedFields: PatchGuessObject,
  ): Promise<GuessObjectId> {
    return this.guessObjectRepository.update(id, updatedFields);
  }

  @Transactional()
  async delete(id: GuessObjectId): Promise<void> {
    const guess_object = await this.guessObjectRepository.findForDeletion(id);
    if (!guess_object) {
      throw new NotFoundException({
        code: ErrorCode.GUESS_OBJECTS_NOT_FOUND,
        message: `Guess object not found`,
      });
    }

    if (guess_object.categories.length > 0) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `Cannot delete guess object because it belongs to one or more categories`,
      });
    }

    await this.guessObjectRepository.delete(id);
    const count = await this.guessObjectRepository.countByWorldLocationId(
      guess_object.world_location_id,
    );
    if (count === 0) {
      await this.worldLocationService.delete(guess_object.world_location_id);
    }
  }

  async searchDraftByName(name: string): Promise<GuessObjectDraft[]> {
    return this.guessObjectRepository.searchDraftByName(name);
  }
}
