import { Category } from '@cityborn/api';
import type {
  Category as PrismaCategory,
  GuessObject as PrismaGuessObject,
} from '@prisma/client';
import { GuessObjectMapper } from 'src/guess-object/mappers/guess-object.mapper';

type PrismaCategoryWithRelations = PrismaCategory & {
  guessObjects?: PrismaGuessObject[];
};

export class CategoryMapper {
  static toCategory(prismaCategory: PrismaCategoryWithRelations): Category {
    return {
      id: prismaCategory.id,
      name: prismaCategory.name,
      isPublished: prismaCategory.isPublished,
      description: prismaCategory.description ?? undefined,
      guessObjects: prismaCategory.guessObjects
        ? prismaCategory.guessObjects.map((obj) =>
            GuessObjectMapper.toGuessObject(obj),
          )
        : undefined,
    };
  }

  static toCategories(prismaCategories: PrismaCategory[]): Category[] {
    return prismaCategories.map((category) =>
      CategoryMapper.toCategory(category),
    );
  }
}
