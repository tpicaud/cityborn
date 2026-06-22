import {
  FullGuessObject,
  GuessObject,
  GuessObjectDraft,
} from '@cityborn/api';
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
  world_location: PrismaWorldLocation;
};

export class GuessObjectMapper {
  static toGuessObject(prismaGuessObject: PrismaGuessObject): GuessObject {
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
    };
  }

  static toFullGuessObject(
    prismaGuessObject: PrismaGuessObjectWithRelations,
  ): FullGuessObject {
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
      world_location: WorldLocationMapper.toWorldLocation(
        prismaGuessObject.world_location,
      ),
    };
  }

  static toGuessObjectDraft(
    response: WikidataItemResponse,
  ): GuessObjectDraft {
    return {
      source: {
        provider: 'wikidata',
        external_id: response.id,
      },
      name: response.label,
      description: response.description ?? undefined,
      short_description: response.short_description ?? undefined,
      image: response.image ?? undefined,
    };
  }

  static toGuessObjectDraftFromPrisma(
    prismaGuessObject: PrismaGuessObject,
  ): GuessObjectDraft {
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
    };
  }

  static toGuessObjectsSearchResponse(
    response: WikidataSearchResponse,
  ): GuessObjectDraft[] {
    return response.results.map((item) =>
      GuessObjectMapper.toGuessObjectDraft(item),
    );
  }
}
