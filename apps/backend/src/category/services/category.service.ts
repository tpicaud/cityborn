import {
  type Category,
  type CategoryId,
  type CategoryTree,
  type CreateCategory,
  ErrorCode,
  type FullCategory,
  type GuessObjectId,
  type UpdateCategory,
} from '@cityborn/api';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { GuessObjectService } from '../../guess-object/guess-object.service';
import {
  CATEGORY_REPOSITORY,
  type CategoryFilter,
  type CategoryRepository,
} from '../repositories/category.repository';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
    private readonly guessObjectService: GuessObjectService,
  ) {}

  async findTree(
    filter: Pick<CategoryFilter, 'isPublished'>,
  ): Promise<CategoryTree[]> {
    return this.categoryRepository.findTree(filter);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.findBy({});
  }

  async findBy(filter: CategoryFilter): Promise<Category[]> {
    return this.categoryRepository.findBy(filter);
  }

  async findFullBy(filter: CategoryFilter): Promise<FullCategory[]> {
    return this.categoryRepository.findFullBy(filter);
  }

  async create(data: CreateCategory): Promise<Category> {
    return this.categoryRepository.create(data);
  }

  async update(
    categoryId: CategoryId,
    data: UpdateCategory,
  ): Promise<Category> {
    if (!data.disconnectIds?.length) {
      return this.categoryRepository.update(categoryId, data);
    }
    return this.updateWithOrphanCleanup(categoryId, data, data.disconnectIds);
  }

  @Transactional()
  private async updateWithOrphanCleanup(
    categoryId: CategoryId,
    data: UpdateCategory,
    disconnectIds: GuessObjectId[],
  ): Promise<Category> {
    const updated_category = await this.categoryRepository.update(
      categoryId,
      data,
    );
    for (const id of disconnectIds) {
      const count = await this.categoryRepository.countByGuessObjectId(id);
      if (count === 0) await this.guessObjectService.delete(id);
    }
    return updated_category;
  }

  @Transactional()
  async delete(id: CategoryId): Promise<void> {
    const [category] = await this.findFullBy({ ids: [id] });

    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.CATEGORY_NOT_FOUND,
        message: `Category with id ${id} not found`,
      });
    }

    const childrenCount = await this.categoryRepository.countChildren(id);
    if (childrenCount > 0) {
      throw new BadRequestException({
        code: ErrorCode.CATEGORY_HAS_CHILDREN,
        message: `Category with id ${id} has children and cannot be deleted`,
      });
    }

    await this.categoryRepository.delete(id);
    for (const guessObject of category.guessObjects) {
      const count = await this.categoryRepository.countByGuessObjectId(
        guessObject.id,
      );
      if (count === 0) await this.guessObjectService.delete(guessObject.id);
    }
  }
}
