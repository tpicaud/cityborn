import { ErrorCode } from '@cityborn/errors';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesResponseDto } from '../dto/categories.response.dto';
import { CategoryDto } from '../dto/category.dto';
import { CategoryMapper } from '../mappers/category.mapper';
import { CategoryService } from './category.service';

@Injectable()
export class PublicCategoryService {
  constructor(private readonly categoryService: CategoryService) {}

  async findAll({
    includes = [],
  }: {
    includes?: string[];
  }): Promise<CategoriesResponseDto> {
    const categories = await this.categoryService.findAll({ includes });
    const filtered_categories = categories.filter(
      (category) => category.isPublished,
    );
    return CategoryMapper.toCategoriesResponseDto(filtered_categories);
  }

  async findOne(
    id: string,
    {
      includes = [],
    }: {
      includes: string[];
    },
  ): Promise<CategoryDto> {
    const category = await this.categoryService.findOne(id, { includes });

    if (!category || !category.isPublished) {
      throw new NotFoundException({
        code: ErrorCode.CATEGORY_NOT_FOUND,
        message: `Category with id ${id} not found`,
      });
    }

    return CategoryMapper.toCategoryDto(category);
  }
}
