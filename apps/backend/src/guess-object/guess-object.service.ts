import {
  CreateGuessObject,
  ErrorCode,
  FullGuessObject,
  GameConfig,
  GuessObject,
  GuessObjectDraft,
  PatchGuessObject,
} from '@cityborn/api';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorldLocationService } from '../world-location/world-location.service';
import { GuessObjectMapper } from './mappers/guess-object.mapper';

@Injectable()
export class GuessObjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly worldLocationService: WorldLocationService,
  ) {}

  async findBy(filter: {
    ids?: string[];
    external_id?: string;
  }): Promise<GuessObject[]> {
    const rowsGuessObject = await this.prisma.guessObject.findMany({
      where: {
        ...(filter.ids && { id: { in: filter.ids } }),
        ...(filter.external_id && {
          source: { path: ['external_id'], equals: filter.external_id },
        }),
      },
      include: {
        world_location: true,
      },
    });
    return rowsGuessObject.map((obj) => GuessObjectMapper.toGuessObject(obj));
  }

  async findFullBy(filter: {
    ids?: string[];
    external_id?: string;
  }): Promise<FullGuessObject[]> {
    const rows = await this.prisma.guessObject.findMany({
      where: {
        ...(filter.ids && { id: { in: filter.ids } }),
        ...(filter.external_id && {
          source: { path: ['external_id'], equals: filter.external_id },
        }),
      },
      include: { world_location: { include: { geometry: true } } },
    });
    return rows.map((obj) => GuessObjectMapper.toFullGuessObject(obj));
  }

  async findShuffledGuessObjectsByGameConfig(
    gameConfig: GameConfig,
  ): Promise<FullGuessObject[]> {
    const where: Prisma.GuessObjectWhereInput = {};

    if (gameConfig.categories && gameConfig.categories.length > 0) {
      const categoryIds = gameConfig.categories.map((cat) => cat.id);
      where.categories = {
        some: {
          id: { in: categoryIds },
        },
      };
    }

    const allObjects = await this.prisma.guessObject.findMany({
      where,
      include: { world_location: { include: { geometry: true } } },
    });

    const shuffled = allObjects.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, gameConfig.nbOfObjects);

    return selected.map((obj) => GuessObjectMapper.toFullGuessObject(obj));
  }

  async create(createGuessObject: CreateGuessObject): Promise<string> {
    const worldLocationPreview = await this.worldLocationService.getPreviewById(
      createGuessObject.world_location_id,
    );
    if (!worldLocationPreview) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `World location ${createGuessObject.world_location_id} not found`,
      });
    }

    const existingGuessObject = await this.prisma.guessObject.findFirst({
      where: {
        name: createGuessObject.name,
        world_location_id: createGuessObject.world_location_id,
      },
    });

    if (existingGuessObject) {
      return existingGuessObject.id;
    }

    const prisma_guess_object = await this.prisma.guessObject.create({
      data: {
        name: createGuessObject.name,
        image: createGuessObject.image,
        description: createGuessObject.description,
        short_description: createGuessObject.short_description,
        world_location_id: createGuessObject.world_location_id,
      },
    });

    return prisma_guess_object.id;
  }

  async update(id: string, updatedFields: PatchGuessObject): Promise<string> {
    const data = {
      name: updatedFields.name,
      image: updatedFields.image,
      description: updatedFields.description,
      short_description: updatedFields.short_description,
      ...(updatedFields.world_location_id && {
        world_location_id: updatedFields.world_location_id,
      }),
    };

    const updated_object = await this.prisma.guessObject.update({
      where: { id },
      data,
    });

    return updated_object.id;
  }

  async delete(id: string): Promise<void> {
    const guess_object = await this.prisma.guessObject.findUnique({
      where: { id },
      include: { categories: true },
    });

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

    await this.prisma.guessObject.delete({
      where: { id },
    });

    const count = await this.prisma.guessObject.count({
      where: { world_location_id: guess_object.world_location_id },
    });

    if (count === 0) {
      await this.worldLocationService.delete(guess_object.world_location_id);
    }
  }

  async searchDraftByName(name: string): Promise<GuessObjectDraft[]> {
    const prisma_guess_objects = await this.prisma.guessObject.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
    });
    return prisma_guess_objects.map((obj) =>
      GuessObjectMapper.toGuessObjectDraftFromPrisma(obj),
    );
  }
}
