import {
  CreateGuessObject,
  ErrorCode,
  GameConfig,
  GuessObject,
  GuessObjectCandidate,
} from '@cityborn/api';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorldLocationService } from '../world-location/world-location.service';
import { GuessObjectMapper } from './mappers/guess-object.mapper';

@Injectable()
export class GuessObjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly worldLocationService: WorldLocationService,
  ) {}

  private buildInclude(includes: string[]) {
    let include: any = {};

    if (includes.includes('world_location')) {
      include = { world_location: true };
    }

    if (includes.includes('world_location_preview')) {
      include = {
        world_location: {
          select: {
            id: true,
            osm_type: true,
            name: true,
            display_name: true,
          },
        },
      };
    }

    return include;
  }

  async findById(id: string, includes: string[] = []): Promise<GuessObject> {
    const guess_object = await this.prisma.guessObject.findUnique({
      where: { id },
      include: this.buildInclude(includes),
    });

    if (!guess_object) {
      throw new NotFoundException({
        code: ErrorCode.GUESS_OBJECTS_NOT_FOUND,
        message: 'No GuessObject found for the provided ID',
      });
    }

    return GuessObjectMapper.toGuessObject(guess_object);
  }

  async findSome(guessObjectsIds: string[]): Promise<GuessObject[]> {
    try {
      const rawGuessObjects = await this.prisma.guessObject.findMany({
        where: {
          id: { in: guessObjectsIds },
        },
        include: {
          world_location: true,
        },
      });

      if (!rawGuessObjects || rawGuessObjects.length === 0) {
        throw new NotFoundException({
          code: ErrorCode.GUESS_OBJECTS_NOT_FOUND,
          message: 'No GuessObjects found for the provided IDs',
        });
      }

      const guessObjects = rawGuessObjects.map((obj) =>
        GuessObjectMapper.toGuessObject(obj),
      );
      return guessObjects;
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCode.GUESS_OBJECTS_GET_FAILED,
        message: `Error retrieving guess objects : ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  async findByGameConfig(gameConfig: GameConfig): Promise<GuessObject[]> {
    try {
      const where: any = {};

      // Si des catégories sont spécifiées et qu’elles ne contiennent pas "TOUTES"
      if (gameConfig.categories && gameConfig.categories.length > 0) {
        const categoryIds = gameConfig.categories.map((cat) => cat.id);
        where.categories = {
          some: {
            id: { in: categoryIds },
          },
        };
      }

      // Récupération de tous les objets correspondants
      const allObjects = await this.prisma.guessObject.findMany({
        where,
        include: { world_location: true },
      });

      // Mélange aléatoire et sélection
      const shuffled = allObjects.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, gameConfig.nbOfObjects);

      // Conversion en
      return selected.map((obj) => GuessObjectMapper.toGuessObject(obj));
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCode.GUESS_OBJECTS_GET_FAILED,
        message: `Error retrieving guess objects from game config: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  async update(
    id: string,
    updatedFields: Partial<GuessObject>,
  ): Promise<string> {
    const world_location_id = await this.resolveWorldLocationId(updatedFields);
    if (world_location_id) updatedFields.world_location_id = world_location_id;

    const data = {
      name: updatedFields.name,
      image: updatedFields.image,
      description: updatedFields.description,
      short_description: updatedFields.short_description,
      world_location_id: updatedFields.world_location_id,
    };

    const updated_object = await this.prisma.guessObject.update({
      where: { id },
      data,
    });

    return updated_object.id;
  }

  async searchByName(name: string): Promise<GuessObjectCandidate[]> {
    const prisma_guess_objects = await this.prisma.guessObject.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
    });
    return prisma_guess_objects.map((obj) =>
      GuessObjectMapper.toGuessObjectCandidateFromPrisma(obj),
    );
  }

  async findByExternalId(external_id: string): Promise<GuessObject | null> {
    const guessObject = await this.prisma.guessObject.findFirst({
      where: {
        source: {
          path: ['external_id'],
          equals: external_id,
        },
      },
      include: {
        world_location: true,
      },
    });
    if (!guessObject) return null;

    return GuessObjectMapper.toGuessObject(guessObject);
  }

  async create(createGuessObject: CreateGuessObject): Promise<string> {
    // Récupérer la location dans la db
    let world_location = await this.worldLocationService.get(
      createGuessObject.world_location_id,
    );
    if (!world_location) {
      if (!createGuessObject.world_location) {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message: `No world location id found, and no world location provided`,
        });
      }
      // Si pas présente, utiliser la loc dans la requête
      world_location = await this.worldLocationService.create(
        createGuessObject.world_location,
      );
    }

    // Vérifier si un GuessObject avec le même nom et world_location_id existe déjà
    const existingGuessObject = await this.prisma.guessObject.findFirst({
      where: {
        name: createGuessObject.name,
        world_location_id: world_location.id,
      },
    });

    if (existingGuessObject) {
      return existingGuessObject.id;
    }

    // Créer le GuessObject avec l'id de la loc
    const prisma_guess_object = await this.prisma.guessObject.create({
      data: {
        name: createGuessObject.name,
        image: createGuessObject.image,
        description: createGuessObject.description,
        short_description: createGuessObject.short_description,
        world_location_id: world_location.id,
      },
    });

    return prisma_guess_object.id;
  }

  async delete(id: string): Promise<void> {
    const guess_object = await this.prisma.guessObject.findUnique({
      where: { id },
      include: { categories: true }, // inclut les catégories associées
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

  private async resolveWorldLocationId(
    updatedFields: Partial<GuessObject>,
  ): Promise<string | undefined> {
    const { world_location_id, world_location } = updatedFields;

    if (world_location_id) {
      const exists = await this.worldLocationService.get(world_location_id);
      if (exists) return world_location_id;

      if (!world_location) {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message: `No world location found for id ${world_location_id}`,
        });
      }

      const newLoc = await this.worldLocationService.create(world_location);
      return newLoc.id;
    }

    if (world_location) {
      const newLoc = await this.worldLocationService.create(world_location);
      return newLoc.id;
    }

    return undefined;
  }
}
