import type {
  GuessObject as PrismaGuessObject,
  WorldLocation as PrismaWorldLocation,
} from '@prisma/client';
import type {
  WikidataItemResponse,
  WikidataSearchResponse,
} from 'src/wikidata/wikidata.service';
import { WorldLocationMapper } from 'src/world-location/mapper/world-location.mapper';
import type { GuessObjectDto } from '../dto/guess-object.dto';
import type { GuessObjectCandidateDto } from '../dto/search-guess-object.response.dto';

type PrismaGuessObjectWithRelations = PrismaGuessObject & {
  world_location?: PrismaWorldLocation;
};

export class GuessObjectMapper {
  static toGuessObjectDto(
    prismaGuessObject: PrismaGuessObjectWithRelations,
  ): GuessObjectDto {
    return {
      id: prismaGuessObject.id,
      name: prismaGuessObject.name,
      image: prismaGuessObject.image ?? undefined,
      description: prismaGuessObject.description ?? undefined,
      short_description: prismaGuessObject.short_description ?? undefined,
      source:
        (prismaGuessObject.source as unknown as {
          provider: string;
          external_id: string;
        }) ?? undefined,
      world_location_id: prismaGuessObject.world_location_id,
      world_location: prismaGuessObject.world_location
        ? WorldLocationMapper.toWorldLocationDto(
            prismaGuessObject.world_location,
          )
        : undefined,
    };
  }

  static toGuessObjectCandidateDto(
    response: WikidataItemResponse,
  ): GuessObjectCandidateDto {
    return {
      source: {
        provider: 'wikidata',
        external_id: response.id,
      },
      name: response.label,
      description: response.description ?? undefined,
      short_description: response.short_description ?? undefined,
      image: response.image ?? undefined,

      world_location_id: response.world_location_id ?? undefined,
    };
  }

  static toGuessObjectCandidateFromPrismaDto(
    prismaGuessObject: PrismaGuessObjectWithRelations,
  ): GuessObjectCandidateDto {
    return {
      source:
        (prismaGuessObject.source as unknown as {
          provider: string;
          external_id: string;
        }) ?? undefined,
      name: prismaGuessObject.name,
      description: prismaGuessObject.description ?? undefined,
      short_description: prismaGuessObject.short_description ?? undefined,
      image: prismaGuessObject.image ?? undefined,
      world_location_id: prismaGuessObject.world_location_id,
      world_location: prismaGuessObject.world_location
        ? WorldLocationMapper.toWorldLocationDto(
            prismaGuessObject.world_location,
          )
        : undefined,
    };
  }

  static toGuessObjectsSearchResponseDto(
    response: WikidataSearchResponse,
  ): GuessObjectCandidateDto[] {
    return response.results.map((item) =>
      GuessObjectMapper.toGuessObjectCandidateDto(item),
    );
  }
}
