import { Category, CreateCategory, ErrorCode, FullCategory, UpdateCategory } from '@cityborn/api';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryMapper } from '../mappers/category.mapper';
import { CategoryService } from './category.service';

@Injectable()
export class AdminCategoryService {
  constructor(private readonly categoryService: CategoryService) {}

  async findAll(): Promise<Category[]> {
    const categories = await this.categoryService.findAll();
    return CategoryMapper.toCategories(categories);
  }

  async findBy(filter: { ids?: string[] }): Promise<Category[]> {
    const categories = await this.categoryService.findBy(filter);
    return CategoryMapper.toCategories(categories);
  }

  async findFullBy(id: string): Promise<FullCategory> {
    const [category] = await this.categoryService.findFullBy({ ids: [id] });
    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.CATEGORY_NOT_FOUND,
        message: `Category with id ${id} not found`,
      });
    }
    return CategoryMapper.toFullCategory(category);
  }

  async create(data: CreateCategory): Promise<Category> {
    const category = await this.categoryService.create(data);
    return CategoryMapper.toCategory(category);
  }

  async update(id: string, data: UpdateCategory): Promise<Category> {
    const updated_category = await this.categoryService.update(id, data);
    return CategoryMapper.toCategory(updated_category);
  }

  async delete(id: string): Promise<void> {
    await this.categoryService.delete(id);
  }
}
