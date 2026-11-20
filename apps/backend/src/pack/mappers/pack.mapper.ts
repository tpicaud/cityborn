import {
  type FullPack,
  FullPackSchema,
  type Pack,
  PackSchema,
} from '@cityborn/api';
import type {
  GuessObject as PrismaGuessObject,
  Pack as PrismaPack,
  WorldLocation,
} from '@prisma/client';
import { GuessObjectMapper } from '../../guess-object/mappers/guess-object.mapper';

type PrismaPackWithRelations = PrismaPack & {
  guessObjects?: (PrismaGuessObject & { world_location: WorldLocation })[];
};

export const PackMapper = {
  toPack(prismaPack: PrismaPack): Pack {
    return PackSchema.parse({
      id: prismaPack.id,
      name: prismaPack.name,
      isPublished: prismaPack.isPublished,
      description: prismaPack.description ?? undefined,
      image: prismaPack.image ?? undefined,
      themeId: prismaPack.themeId,
    });
  },

  toPacks(prismaPacks: PrismaPack[]): Pack[] {
    return prismaPacks.map((pack) => PackMapper.toPack(pack));
  },

  toFullPack(prismaPack: PrismaPackWithRelations): FullPack {
    return FullPackSchema.parse({
      id: prismaPack.id,
      name: prismaPack.name,
      isPublished: prismaPack.isPublished,
      description: prismaPack.description ?? undefined,
      image: prismaPack.image ?? undefined,
      themeId: prismaPack.themeId,
      guessObjects:
        prismaPack.guessObjects?.map((guessObject) =>
          GuessObjectMapper.toGuessObject(guessObject),
        ) ?? [],
    });
  },

  toFullPacks(prismaPacks: PrismaPackWithRelations[]): FullPack[] {
    return prismaPacks.map((pack) => PackMapper.toFullPack(pack));
  },
};
