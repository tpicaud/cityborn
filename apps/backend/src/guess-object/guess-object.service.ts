import { ErrorCode } from '@cityborn/errors';
import { GameConfig } from '@cityborn/types';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorldLocationService } from 'src/world-location/world-location.service';
import { CreateGuessObjectDto } from './dto/create-guess-object.dto';
import { GuessObjectDto } from './dto/guess-object.dto';
import { GuessObjectCandidateDto } from './dto/search-guess-object.response.dto';
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

  async findById(id: string, includes: string[] = []): Promise<GuessObjectDto> {
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

    return GuessObjectMapper.toGuessObjectDto(guess_object);
  }

  async findSome(guessObjectsIds: string[]): Promise<GuessObjectDto[]> {
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
        GuessObjectMapper.toGuessObjectDto(obj),
      );
      return guessObjects;
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCode.GUESS_OBJECTS_GET_FAILED,
        message: `Error retrieving guess objects : ${error.message}`,
      });
    }
  }

  async findByGameConfig(gameConfig: GameConfig): Promise<GuessObjectDto[]> {
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

      // Conversion en DTO
      return selected.map((obj) => GuessObjectMapper.toGuessObjectDto(obj));
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCode.GUESS_OBJECTS_GET_FAILED,
        message: `Error retrieving guess objects from game config: ${error.message}`,
      });
    }
  }

  async update(
    id: string,
    updatedFields: Partial<GuessObjectDto>,
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

  async searchByName(name: string): Promise<GuessObjectCandidateDto[]> {
    const prisma_guess_objects = await this.prisma.guessObject.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
    });
    return prisma_guess_objects.map((obj) =>
      GuessObjectMapper.toGuessObjectCandidateFromPrismaDto(obj),
    );
  }

  async findByExternalId(external_id: string): Promise<GuessObjectDto | null> {
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

    return GuessObjectMapper.toGuessObjectDto(guessObject);
  }

  async create(createGuessObjectDto: CreateGuessObjectDto): Promise<string> {
    // Récupérer la location dans la db
    let world_location = await this.worldLocationService.get(
      createGuessObjectDto.world_location_id,
    );
    if (!world_location) {
      if (!createGuessObjectDto.world_location) {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message: `No world location id found, and no world location provided`,
        });
      }
      // Si pas présente, utiliser la loc dans la requête
      world_location = await this.worldLocationService.create(
        createGuessObjectDto.world_location,
      );
    }

    // Vérifier si un GuessObject avec le même nom et world_location_id existe déjà
    const existingGuessObject = await this.prisma.guessObject.findFirst({
      where: {
        name: createGuessObjectDto.name,
        world_location_id: world_location.id,
      },
    });

    if (existingGuessObject) {
      return existingGuessObject.id;
    }

    // Créer le GuessObject avec l'id de la loc
    const prisma_guess_object = await this.prisma.guessObject.create({
      data: {
        name: createGuessObjectDto.name,
        image: createGuessObjectDto.image,
        description: createGuessObjectDto.description,
        short_description: createGuessObjectDto.short_description,
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
    updatedFields: Partial<GuessObjectDto>,
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
