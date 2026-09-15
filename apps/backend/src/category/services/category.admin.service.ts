import {
  type Category,
  type CategoryId,
  type CategoryTree,
  type CreateCategory,
  ErrorCode,
  type FullCategory,
  type UpdateCategory,
} from '@cityborn/api';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryService } from './category.service';

@Injectable()
export class AdminCategoryService {
  constructor(private readonly categoryService: CategoryService) {}

  async findAll(): Promise<Category[]> {
    const categories = await this.categoryService.findAll();
    return categories;
  }

  async findBy(filter: { ids?: CategoryId[] }): Promise<Category[]> {
    const categories = await this.categoryService.findBy(filter);
    return categories;
  }

  async findFullBy(id: CategoryId): Promise<FullCategory> {
    const [category] = await this.categoryService.findFullBy({ ids: [id] });
    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.CATEGORY_NOT_FOUND,
        message: `Category with id ${id} not found`,
      });
    }
    return category;
  }

  async create(data: CreateCategory): Promise<Category> {
    const category = await this.categoryService.create(data);
    return category;
  }

  async update(id: CategoryId, data: UpdateCategory): Promise<Category> {
    const updated_category = await this.categoryService.update(id, data);
    return updated_category;
  }

  async delete(id: CategoryId): Promise<void> {
    await this.categoryService.delete(id);
  }

  async getTrees(): Promise<CategoryTree[]> {
    const roots = await this.categoryService.findTree({});
    return roots;
  }
}
