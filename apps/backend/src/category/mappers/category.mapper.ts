import {
  type Category,
  CategorySchema,
  type CategoryTree,
  CategoryTreeSchema,
  type FullCategory,
  FullCategorySchema,
} from '@cityborn/api';
import type {
  Category as PrismaCategory,
  GuessObject as PrismaGuessObject,
  WorldLocation,
} from '@prisma/client';
import { GuessObjectMapper } from '../../guess-object/mappers/guess-object.mapper';
import type { PrismaCategoryNode } from '../services/category.service';

type PrismaCategoryWithRelations = PrismaCategory & {
  guessObjects?: (PrismaGuessObject & { world_location: WorldLocation })[];
};

export const CategoryMapper = {
  toCategory(prismaCategory: PrismaCategoryWithRelations): Category {
    return CategorySchema.parse({
      id: prismaCategory.id,
      name: prismaCategory.name,
      isPublished: prismaCategory.isPublished,
      description: prismaCategory.description ?? undefined,
      parentId: prismaCategory.parentId ?? undefined,
    });
  },

  toCategories(prismaCategories: PrismaCategory[]): Category[] {
    return prismaCategories.map((category) =>
      CategoryMapper.toCategory(category),
    );
  },

  toFullCategory(prismaCategory: PrismaCategoryWithRelations): FullCategory {
    return FullCategorySchema.parse({
      id: prismaCategory.id,
      name: prismaCategory.name,
      isPublished: prismaCategory.isPublished,
      description: prismaCategory.description ?? undefined,
      parentId: prismaCategory.parentId ?? undefined,
      guessObjects:
        prismaCategory.guessObjects?.map((guessObject) =>
          GuessObjectMapper.toGuessObject(guessObject),
        ) ?? [],
    });
  },

  toFullCategories(
    prismaCategories: PrismaCategoryWithRelations[],
  ): FullCategory[] {
    return prismaCategories.map((category) =>
      CategoryMapper.toFullCategory(category),
    );
  },

  toCategoryTree(node: PrismaCategoryNode): CategoryTree {
    return CategoryTreeSchema.parse({
      id: node.id,
      name: node.name,
      isPublished: node.isPublished,
      description: node.description ?? undefined,
      parentId: node.parentId ?? undefined,
      children: node.children.map((child) =>
        CategoryMapper.toCategoryTree(child),
      ),
    });
  },

  toCategoryTrees(roots: PrismaCategoryNode[]): CategoryTree[] {
    return roots.map((root) => CategoryMapper.toCategoryTree(root));
  },
};
