import { WikidataItemResponse, WikidataSearchResponse } from "src/wikidata/wikidata.service";
import { GuessObjectDto } from "../dto/guess-object.dto";
import { GuessObject as PrismaGuessObject, WorldLocation as PrismaWorldLocation } from '@prisma/client';
import { GuessObjectCandidateDto, GuessObjectsSearchResponseDto } from "../dto/search-guess-object.response.dto";
import { WorldLocationMapper } from "src/world-location/mapper/world-location.mapper";

type PrismaGuessObjectWithRelations = PrismaGuessObject & {
    world_location?: PrismaWorldLocation;
};

export class GuessObjectMapper {
    static toGuessObjectDto(prismaGuessObject: PrismaGuessObjectWithRelations): GuessObjectDto {
        return {
            id: prismaGuessObject.id,
            name: prismaGuessObject.name,
            image: prismaGuessObject.image ?? undefined,
            description: prismaGuessObject.description ?? undefined,
            short_description: prismaGuessObject.short_description ?? undefined,
            world_location_id: prismaGuessObject.world_location_id,
            world_location: prismaGuessObject.world_location ? WorldLocationMapper.toWorldLocationDto(prismaGuessObject.world_location) : undefined
        }
    }

    static toGuessObjectCandidateDto(response: WikidataItemResponse): GuessObjectCandidateDto {
        return {
            external_id: response.id,
            name: response.label,
            description: response.description ?? undefined,
            short_description: response.short_description ?? undefined,
            image: response.image ?? undefined,
            world_location_id: response.world_location_id ?? undefined,
        }
    }

    static toGuessObjectsSearchResponseDto(response: WikidataSearchResponse): GuessObjectsSearchResponseDto {
        return {
            candidates: response.results.map(item => this.toGuessObjectCandidateDto(item))
        }
    }
}