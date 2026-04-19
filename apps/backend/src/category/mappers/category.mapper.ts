import type {
  Category as PrismaCategory,
  GuessObject as PrismaGuessObject,
} from '@prisma/client';
import { GuessObjectMapper } from 'src/guess-object/mappers/guess-object.mapper';
import type { CategoriesResponseDto } from '../dto/categories.response.dto';
import type { CategoryDto } from '../dto/category.dto';

type PrismaCategoryWithRelations = PrismaCategory & {
  guessObjects?: PrismaGuessObject[];
};

export class CategoryMapper {
  static toCategoryDto(
    prismaCategory: PrismaCategoryWithRelations,
  ): CategoryDto {
    return {
      id: prismaCategory.id,
      name: prismaCategory.name,
      isPublished: prismaCategory.isPublished,
      description: prismaCategory.description ?? undefined,
      guessObjects: prismaCategory.guessObjects
        ? prismaCategory.guessObjects.map((obj) =>
            GuessObjectMapper.toGuessObjectDto(obj),
          )
        : undefined,
    };
  }

  static toCategoriesResponseDto(
    prismaCategories: PrismaCategory[],
  ): CategoriesResponseDto {
    return {
      categories: prismaCategories.map((category) =>
        CategoryMapper.toCategoryDto(category),
      ),
    };
  }
}
