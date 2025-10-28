import { GuessObject as PrismaGuessObject, Category as PrismaCategory } from "@prisma/client";
import { CategoryDto } from "../dto/category.dto";
import { CategoriesResponseDto } from "../dto/categories.response.dto";
import { GuessObjectMapper } from "src/guess-object/mappers/guess-object.mapper";

type PrismaCategoryWithRelations = PrismaCategory & {
    guessObjects?: PrismaGuessObject[];
};

export class CategoryMapper {
    static toCategoryDto(prismaCategory: PrismaCategoryWithRelations): CategoryDto {
        return {
            id: prismaCategory.id,
            name: prismaCategory.name,
            description: prismaCategory.description ?? undefined,
            guessObjects: prismaCategory.guessObjects
                ? prismaCategory.guessObjects.map(obj => GuessObjectMapper.toGuessObjectDto(obj))
                : undefined
        }
    }

    static toCategoriesResponseDto(prismaCategories: PrismaCategory[]): CategoriesResponseDto {
        return {
            categories: prismaCategories.map(category => this.toCategoryDto(category))
        }
    }
}