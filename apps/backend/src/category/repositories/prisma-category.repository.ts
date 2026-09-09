import type {
  Category,
  CategoryId,
  CategoryTree,
  CreateCategory,
  FullCategory,
  GuessObjectId,
  UpdateCategory,
} from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import {
  CategoryMapper,
  type PrismaCategoryNode,
} from '../mappers/category.mapper';
import type { CategoryFilter, CategoryRepository } from './category.repository';

const TREE_DEPTH = 6;

function buildChildrenInclude(depth: number): object {
  if (depth === 0) return {};
  return { children: { include: buildChildrenInclude(depth - 1) } };
}

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async findTree(
    filter: Pick<CategoryFilter, 'isPublished'>,
  ): Promise<CategoryTree[]> {
    const roots = await this.txHost.tx.category.findMany({
      where: {
        parentId: null,
        ...(filter.isPublished !== undefined && {
          isPublished: filter.isPublished,
        }),
      },
      include: buildChildrenInclude(TREE_DEPTH),
    });
    return CategoryMapper.toCategoryTrees(roots as PrismaCategoryNode[]);
  }

  async findBy(filter: CategoryFilter): Promise<Category[]> {
    const categories = await this.txHost.tx.category.findMany({
      where: {
        ...(filter.ids && { id: { in: filter.ids } }),
        ...(filter.isPublished !== undefined && {
          isPublished: filter.isPublished,
        }),
      },
    });
    return CategoryMapper.toCategories(categories);
  }

  async findFullBy(filter: CategoryFilter): Promise<FullCategory[]> {
    const categories = await this.txHost.tx.category.findMany({
      where: {
        ...(filter.ids && { id: { in: filter.ids } }),
        ...(filter.isPublished !== undefined && {
          isPublished: filter.isPublished,
        }),
      },
      include: { guessObjects: { include: { world_location: true } } },
    });
    return CategoryMapper.toFullCategories(categories);
  }

  async create(data: CreateCategory): Promise<Category> {
    const { guessObjectsIds, ...categoryData } = data;
    const category = await this.txHost.tx.category.create({
      data: {
        ...categoryData,
        guessObjects: guessObjectsIds
          ? { connect: guessObjectsIds.map((id) => ({ id })) }
          : undefined,
      },
    });
    return CategoryMapper.toCategory(category);
  }

  async update(
    categoryId: CategoryId,
    data: UpdateCategory,
  ): Promise<Category> {
    const { connectIds, disconnectIds, id, ...categoryData } = data;

    const relationUpdate: {
      connect?: { id: GuessObjectId }[];
      disconnect?: { id: GuessObjectId }[];
    } = {};
    if (connectIds) relationUpdate.connect = connectIds.map((id) => ({ id }));
    if (disconnectIds)
      relationUpdate.disconnect = disconnectIds.map((id) => ({ id }));

    const updated_category = await this.txHost.tx.category.update({
      where: { id: categoryId },
      data: {
        ...categoryData,
        ...(Object.keys(relationUpdate).length > 0
          ? { guessObjects: relationUpdate }
          : {}),
      },
      include: { guessObjects: { include: { world_location: true } } },
    });
    return CategoryMapper.toCategory(updated_category);
  }

  async countChildren(id: CategoryId): Promise<number> {
    return this.txHost.tx.category.count({ where: { parentId: id } });
  }

  async countByGuessObjectId(id: GuessObjectId): Promise<number> {
    return this.txHost.tx.category.count({
      where: { guessObjects: { some: { id } } },
    });
  }

  async delete(id: CategoryId): Promise<void> {
    await this.txHost.tx.category.delete({ where: { id } });
  }
}
