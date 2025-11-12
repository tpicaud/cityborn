import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryMapper } from '../mappers/category.mapper';
import { CategoryService } from './category.service';
import { ErrorCode } from '@cityborn/errors';
import { CategoryDto } from '../dto/category.dto';
import { CategoriesResponseDto } from '../dto/categories.response.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class AdminCategoryService {
  constructor(private readonly categoryService: CategoryService) {}

  async findAll({
    includes = [],
  }: {
    includes?: string[];
  }): Promise<CategoriesResponseDto> {
    const categories = await this.categoryService.findAll({ includes });
    return CategoryMapper.toCategoriesResponseDto(categories);
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

    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.CATEGORY_NOT_FOUND,
        message: `Category with id ${id} not found`,
      });
    }

    return CategoryMapper.toCategoryDto(category);
  }

  async create(data: CreateCategoryDto) {
    const category = await this.categoryService.create(data);
    return CategoryMapper.toCategoryDto(category);
  }

  async update(id: string, data: UpdateCategoryDto) {
    const updated_category = await this.categoryService.update(id, data);
    return CategoryMapper.toCategoryDto(updated_category);
  }

  async delete(id: string) {
    await this.categoryService.delete(id);
  }
}
