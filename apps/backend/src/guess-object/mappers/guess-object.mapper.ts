import { GuessObject, GuessObjectCandidate } from '@cityborn/api';
import type {
  GuessObject as PrismaGuessObject,
  WorldLocation as PrismaWorldLocation,
} from '@prisma/client';
import type {
  WikidataItemResponse,
  WikidataSearchResponse,
} from '../../wikidata/wikidata.service';
import { WorldLocationMapper } from '../../world-location/mapper/world-location.mapper';

type PrismaGuessObjectWithRelations = PrismaGuessObject & {
  world_location?: PrismaWorldLocation;
};

export class GuessObjectMapper {
  static toGuessObject(
    prismaGuessObject: PrismaGuessObjectWithRelations,
  ): GuessObject {
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
        ? WorldLocationMapper.toWorldLocation(prismaGuessObject.world_location)
        : undefined,
    };
  }

  static toGuessObjectCandidate(
    response: WikidataItemResponse,
  ): GuessObjectCandidate {
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

  static toGuessObjectCandidateFromPrisma(
    prismaGuessObject: PrismaGuessObjectWithRelations,
  ): GuessObjectCandidate {
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
        ? WorldLocationMapper.toWorldLocation(prismaGuessObject.world_location)
        : undefined,
    };
  }

  static toGuessObjectsSearchResponse(
    response: WikidataSearchResponse,
  ): GuessObjectCandidate[] {
    return response.results.map((item) =>
      GuessObjectMapper.toGuessObjectCandidate(item),
    );
  }
}
