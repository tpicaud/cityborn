import {
  type FullPack,
  FullPackSchema,
  type Pack,
  PackSchema,
  type PackTree,
  PackTreeSchema,
} from '@cityborn/api';
import type {
  GuessObject as PrismaGuessObject,
  Pack as PrismaPack,
  WorldLocation,
} from '@prisma/client';
import { GuessObjectMapper } from '../../guess-object/mappers/guess-object.mapper';

export type PrismaPackNode = PrismaPack & {
  children: (PrismaPackNode | PrismaPack)[];
};

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
      parentId: prismaPack.parentId ?? undefined,
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
      parentId: prismaPack.parentId ?? undefined,
      guessObjects:
        prismaPack.guessObjects?.map((guessObject) =>
          GuessObjectMapper.toGuessObject(guessObject),
        ) ?? [],
    });
  },

  toFullPacks(prismaPacks: PrismaPackWithRelations[]): FullPack[] {
    return prismaPacks.map((pack) => PackMapper.toFullPack(pack));
  },

  toPackTree(node: PrismaPackNode | PrismaPack): PackTree {
    return PackTreeSchema.parse({
      id: node.id,
      name: node.name,
      isPublished: node.isPublished,
      description: node.description ?? undefined,
      parentId: node.parentId ?? undefined,
      children:
        'children' in node
          ? node.children.map((child) => PackMapper.toPackTree(child))
          : [],
    });
  },

  toPackTrees(roots: PrismaPackNode[]): PackTree[] {
    return roots.map((root) => PackMapper.toPackTree(root));
  },
};
