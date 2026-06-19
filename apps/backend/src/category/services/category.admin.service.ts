import {
  Category,
  CreateCategory,
  ErrorCode,
  UpdateCategory,
} from '@cityborn/api';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryMapper } from '../mappers/category.mapper';
import { CategoryService } from './category.service';

@Injectable()
export class AdminCategoryService {
  constructor(private readonly categoryService: CategoryService) {}

  async findAll({
    includes = [],
  }: {
    includes?: string[];
  }): Promise<Category[]> {
    const categories = await this.categoryService.findAll({ includes });
    return CategoryMapper.toCategories(categories);
  }

  async findOne(
    id: string,
    {
      includes = [],
    }: {
      includes: string[];
    },
  ): Promise<Category> {
    const category = await this.categoryService.findOne(id, { includes });

    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.CATEGORY_NOT_FOUND,
        message: `Category with id ${id} not found`,
      });
    }

    return CategoryMapper.toCategory(category);
  }

  async create(data: CreateCategory) {
    const category = await this.categoryService.create(data);
    return CategoryMapper.toCategory(category);
  }

  async update(id: string, data: UpdateCategory) {
    const updated_category = await this.categoryService.update(id, data);
    return CategoryMapper.toCategory(updated_category);
  }

  async delete(id: string) {
    await this.categoryService.delete(id);
  }
}
