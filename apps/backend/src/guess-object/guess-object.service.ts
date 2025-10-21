import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Categories, GameConfig, GuessObject } from '@cityborn/types';
import { ErrorCode } from '@cityborn/errors';
import { PrismaService } from 'src/prisma/prisma.service';
import { GuessObjectMapper } from './mappers/guess-object.mapper';
import { CreateGuessObjectDto } from './dto/create-guess-object.dto';
import { WikidataService } from 'src/wikidata/wikidata.service';
import { GuessObjectCandidateDto, GuessObjectsSearchResponseDto } from './dto/search-guess-object.response.dto';
import { NominatimService } from 'src/nominatim/nominatim.service';

@Injectable()
export class GuessObjectService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly wikiDataService: WikidataService,
        private readonly nominatimService: NominatimService
    ) { }


    async findSome(guessObjectsIds: string[]): Promise<GuessObject[]> {
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

    async findByGameConfig(gameConfig: GameConfig): Promise<GuessObject[]> {
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

    async searchByName(name: string): Promise<GuessObjectsSearchResponseDto> {
        const wikidata_response = await this.wikiDataService.searchByName(name);
        return GuessObjectMapper.toGuessObjectsSearchResponseDto(wikidata_response);
    }

    async searchById(id: string): Promise<GuessObjectCandidateDto> {
        const wikidata_response = await this.wikiDataService.searchById(id);
        const guessObjectCandidate = GuessObjectMapper.toGuessObjectCandidateDto(wikidata_response);

        if (guessObjectCandidate.world_location_id) {
            const nominatim_response = await this.nominatimService.findByOsmId(guessObjectCandidate.world_location_id);
            if (nominatim_response) guessObjectCandidate.world_location = GuessObjectMapper.toWorldLocationDtoFromNominatimItem(nominatim_response);
        }
        console.log(guessObjectCandidate)
        return guessObjectCandidate;
    }

    async create(createGuessObjectDto: CreateGuessObjectDto): Promise<string> {
        // Récupérer la location dans la db

        // Si pas présente, récupérer la location chez nominatim, puis stocker dans la db

        // Créer le GuessObject avec l'id de la loc
        return ""
    }

    async delete(id: string): Promise<void> {
        await this.prisma.guessObject.delete({
            where: { id },
        });
    }
}
