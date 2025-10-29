import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Categories, GameConfig, GuessObject } from '@cityborn/types';
import { ErrorCode } from '@cityborn/errors';
import { PrismaService } from 'src/prisma/prisma.service';
import { GuessObjectMapper } from './mappers/guess-object.mapper';
import { CreateGuessObjectDto } from './dto/create-guess-object.dto';
import { WikidataService } from 'src/wikidata/wikidata.service';
import { GuessObjectCandidateDto, GuessObjectsSearchResponseDto } from './dto/search-guess-object.response.dto';
import { WorldLocationService } from 'src/world-location/world-location.service';
import { GuessObjectDto } from './dto/guess-object.dto';

@Injectable()
export class GuessObjectService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly wikiDataService: WikidataService,
        private readonly worldLocationService: WorldLocationService
    ) { }

    async findById(id: string, include?: string): Promise<GuessObjectDto> {
        const allowed_includes = ['world_location'];

        const includeOptions: Record<string, boolean> = {};

        if (include) {
            const includes = include
                .split(',')
                .map((i) => i.trim())
                .filter((i) => allowed_includes.includes(i));

            for (const relation of includes) {
                includeOptions[relation] = true;
            }
        }

        const guess_object = await this.prisma.guessObject.findUnique({
            where: { id },
            include: includeOptions
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
                }
            });

            if (!rawGuessObjects || rawGuessObjects.length === 0) {
                throw new NotFoundException({
                    code: ErrorCode.GUESS_OBJECTS_NOT_FOUND,
                    message: 'No GuessObjects found for the provided IDs',
                });
            }

            const guessObjects = rawGuessObjects.map(obj => GuessObjectMapper.toGuessObjectDto(obj))
            return guessObjects;
        } catch (error) {
            throw new InternalServerErrorException({
                code: ErrorCode.GUESS_OBJECTS_GET_FAILED,
                message: `Error retrieving guess objects from game config: ${error.message}`,
            });
        }
    }

    async findByGameConfig(gameConfig: GameConfig): Promise<GuessObjectDto[]> {
        try {
            // Construction du filtre Prisma
            const where: any = {};

            // Si des catégories sont spécifiées et qu’elles ne contiennent pas "TOUTES"
            if (
                gameConfig.categories &&
                gameConfig.categories.length > 0 &&
                !gameConfig.categories.includes(Categories.TOUTES)
            ) {
                where.category = { in: gameConfig.categories };
            }

            // Get random objects
            const allObjects = await this.prisma.guessObject.findMany({
                where,
            });
            const shuffled = allObjects.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, gameConfig.nbOfObjects);

            // Get relations for selected objects
            const selectedRawGuessObjects = await this.prisma.guessObject.findMany({
                where: { id: { in: selected.map(obj => obj.id) } },
                include: {
                    world_location: true,
                },
            });

            const guessObjects = selectedRawGuessObjects.map(obj => GuessObjectMapper.toGuessObjectDto(obj))
            return guessObjects;
        } catch (error) {
            throw new InternalServerErrorException({
                code: ErrorCode.GUESS_OBJECTS_GET_FAILED,
                message: `Error retrieving guess objects from game config: ${error.message}`,
            });
        }
    }

    async update(id: string, updatedFields: Partial<GuessObjectDto>): Promise<string> {

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

    async searchByName(name: string): Promise<GuessObjectsSearchResponseDto> {
        const wikidata_response = await this.wikiDataService.searchByName(name);
        const guess_objects_candidates_from_wikidata = (GuessObjectMapper.toGuessObjectsSearchResponseDto(wikidata_response)).candidates;

        // search in db
        const guess_objects_from_db = await this.prisma.guessObject.findMany({
            where: {
                name: {
                    contains: name,
                    mode: 'insensitive',
                },
            },
        });
        const guess_objects_candidates_from_db = guess_objects_from_db.map(obj => GuessObjectMapper.toGuessObjectCandidateFromPrismaDto(obj));

        // 🔄 Remplacer les candidats Wikidata par ceux de la DB quand l’external_id correspond
        const dbByExternalId = new Map(
            guess_objects_candidates_from_db.map(obj => [obj.source?.external_id, obj]),
        );

        const merged_candidates = guess_objects_candidates_from_wikidata.map(wikiCandidate => {
            const dbObj = dbByExternalId.get(wikiCandidate.source?.external_id);
            if (dbObj) {
                // On renvoie la version DB mappée au bon format
                return dbObj;
            }
            return wikiCandidate;
        });

        return {
            candidates: merged_candidates,
        };
    }

    async findBySourceId(external_id: string): Promise<GuessObjectDto | GuessObjectCandidateDto> {
        const guessObjectInDB = await this.findBySourceIdInDB(external_id);
        if (guessObjectInDB) {
            return guessObjectInDB;
        } else {
            return await this.findBySourceIdInProvider(external_id);
        }
    }

    async findBySourceIdInDB(external_id: string): Promise<GuessObjectDto | null> {
        const guessObject = await this.prisma.guessObject.findFirst({
            where: {
                source: {
                    path: ["external_id"],
                    equals: external_id,
                },
            },
            include: {
                world_location: true
            }
        });
        if (!guessObject) return null;

        return GuessObjectMapper.toGuessObjectDto(guessObject);
    }

    async findBySourceIdInProvider(external_id: string): Promise<GuessObjectCandidateDto> {
        const wikidata_response = await this.wikiDataService.findById(external_id);
        const guessObjectCandidate = GuessObjectMapper.toGuessObjectCandidateDto(wikidata_response);

        if (guessObjectCandidate.world_location_id) {
            const world_location = await this.worldLocationService.findByIdExternal(guessObjectCandidate.world_location_id, guessObjectCandidate.world_location?.osm_type!);
            if (world_location) guessObjectCandidate.world_location = world_location;
        }

        return guessObjectCandidate;
    }

    async create(createGuessObjectDto: CreateGuessObjectDto): Promise<string> {

        // Récupérer la location dans la db
        let world_location = await this.worldLocationService.findByIdInDB(createGuessObjectDto.world_location_id);
        if (!world_location) {
            if (!createGuessObjectDto.world_location) {
                throw new BadRequestException({
                    code: ErrorCode.BAD_REQUEST,
                    message: `No world location id found, and no world location provided`,
                });
            }
            // Si pas présente, récupérer la location chez nominatim, puis stocker dans la db
            world_location = await this.worldLocationService.create(createGuessObjectDto.world_location);
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
            }
        });

        return prisma_guess_object.id;
    }

    async delete(id: string): Promise<void> {
        await this.prisma.guessObject.delete({
            where: { id },
        });
    }

    private async resolveWorldLocationId(updatedFields: Partial<GuessObjectDto>): Promise<string | undefined> {
        const { world_location_id, world_location } = updatedFields;

        if (world_location_id) {
            const exists = await this.worldLocationService.findByIdInDB(world_location_id);
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
