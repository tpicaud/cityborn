import { Category } from '@cityborn/api';
import { Injectable } from '@nestjs/common';
import { CategoryMapper } from '../mappers/category.mapper';
import { CategoryService } from './category.service';

@Injectable()
export class PublicCategoryService {
  constructor(private readonly categoryService: CategoryService) {}

  async findAll(): Promise<Category[]> {
    const categories = await this.categoryService.findBy({ isPublished: true });
    return CategoryMapper.toCategories(categories);
  }

  async findBy(filter: { ids?: string[] }): Promise<Category[]> {
    const categories = await this.categoryService.findBy({
      ...filter,
      isPublished: true,
    });
    return CategoryMapper.toCategories(categories);
  }
}
