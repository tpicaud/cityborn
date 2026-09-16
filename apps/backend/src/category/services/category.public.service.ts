import {
  type Category,
  type CategoryId,
  type CategoryTree,
} from '@cityborn/api';
import { Injectable } from '@nestjs/common';
import { CategoryService } from './category.service';

@Injectable()
export class PublicCategoryService {
  constructor(private readonly categoryService: CategoryService) {}

  async findAll(): Promise<Category[]> {
    const categories = await this.categoryService.findBy({ isPublished: true });
    return categories;
  }

  async findBy(filter: { ids?: CategoryId[] }): Promise<Category[]> {
    const categories = await this.categoryService.findBy({
      ...filter,
      isPublished: true,
    });
    return categories;
  }

  async getTrees(): Promise<CategoryTree[]> {
    const roots = await this.categoryService.findTree({ isPublished: true });
    return roots;
  }
}
