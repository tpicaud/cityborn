import { FullGuessObject, GuessObject, GuessObjectDraft } from '@cityborn/api';
import type {
  GuessObject as PrismaGuessObject,
  WorldLocation as PrismaWorldLocation,
  WorldLocationGeometry as PrismaWorldLocationGeometry,
} from '@prisma/client';
import type {
  WikidataItemResponse,
  WikidataSearchResponse,
} from '../../wikidata/wikidata.service';
import { WorldLocationMapper } from '../../world-location/mapper/world-location.mapper';

type PrismaGuessObjectWithLocation = PrismaGuessObject & {
  world_location: PrismaWorldLocation;
};

export type PrismaGuessObjectWithFullLocation = PrismaGuessObject & {
  world_location: PrismaWorldLocation & {
    geometry: PrismaWorldLocationGeometry | null;
  };
};

export const GuessObjectMapper = {
  toGuessObject(prismaGuessObject: PrismaGuessObjectWithLocation): GuessObject {
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
      world_location_preview: {
        id: prismaGuessObject.world_location.id,
        name: prismaGuessObject.world_location.name,
        display_name:
          prismaGuessObject.world_location.display_name ?? undefined,
      },
    };
  },

  toFullGuessObject(
    prismaGuessObject: PrismaGuessObjectWithFullLocation,
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
  },

  toGuessObjectDraft(response: WikidataItemResponse): GuessObjectDraft {
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
  },

  toGuessObjectDraftFromPrisma(
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
  },

  toGuessObjectsSearchResponse(
    response: WikidataSearchResponse,
  ): GuessObjectDraft[] {
    return response.results.map((item) =>
      GuessObjectMapper.toGuessObjectDraft(item),
    );
  },
};
