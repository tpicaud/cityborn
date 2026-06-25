import { CreateCategory, ErrorCode, UpdateCategory } from '@cityborn/api';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Category as PrismaCategory,
  GuessObject as PrismaGuessObject,
  WorldLocation,
} from '@prisma/client';
import pLimit from 'p-limit';
import { GuessObjectService } from '../../guess-object/guess-object.service';
import { PrismaService } from '../../prisma/prisma.service';

export type PrismaCategoryWithFullGuessObjects = PrismaCategory & {
  guessObjects: (PrismaGuessObject & { world_location: WorldLocation })[];
};

export type PrismaCategoryNode = PrismaCategory & {
  children: PrismaCategoryNode[];
};

const TREE_DEPTH = 6;

function buildChildrenInclude(depth: number): object {
  if (depth === 0) return {};
  return { children: { include: buildChildrenInclude(depth - 1) } };
}

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guessObjectService: GuessObjectService,
  ) {}

  async findTree(filter: {
    isPublished?: boolean;
  }): Promise<PrismaCategoryNode[]> {
    return this.prisma.category.findMany({
      where: {
        parentId: null,
        ...(filter.isPublished !== undefined && {
          isPublished: filter.isPublished,
        }),
      },
      include: buildChildrenInclude(TREE_DEPTH),
    }) as Promise<PrismaCategoryNode[]>;
  }

  async findAll() {
    return this.prisma.category.findMany();
  }

  async findBy(filter: { ids?: string[]; isPublished?: boolean }) {
    return this.prisma.category.findMany({
      where: {
        ...(filter.ids && { id: { in: filter.ids } }),
        ...(filter.isPublished !== undefined && {
          isPublished: filter.isPublished,
        }),
      },
    });
  }

  async findFullBy(filter: {
    ids?: string[];
    isPublished?: boolean;
  }): Promise<PrismaCategoryWithFullGuessObjects[]> {
    return this.prisma.category.findMany({
      where: {
        ...(filter.ids && { id: { in: filter.ids } }),
        ...(filter.isPublished !== undefined && {
          isPublished: filter.isPublished,
        }),
      },
      include: { guessObjects: { include: { world_location: true } } },
    });
  }

  async create(data: CreateCategory) {
    const { guessObjectsIds, ...categoryData } = data;

    return this.prisma.category.create({
      data: {
        ...categoryData,
        guessObjects: guessObjectsIds
          ? { connect: guessObjectsIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  }

  async update(categoryId: string, data: UpdateCategory) {
    const { guessObjects, connectIds, disconnectIds, id, ...categoryData } =
      data;

    const relationUpdate: any = {};
    if (guessObjects) {
      relationUpdate.set = guessObjects.map((go) => ({ id: go.id }));
    } else {
      if (connectIds) relationUpdate.connect = connectIds.map((id) => ({ id }));
      if (disconnectIds)
        relationUpdate.disconnect = disconnectIds.map((id) => ({ id }));
    }

    const updated_category = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...categoryData,
        ...(Object.keys(relationUpdate).length > 0
          ? { guessObjects: relationUpdate }
          : {}),
      },
      include: { guessObjects: { include: { world_location: true } } },
    });

    if (disconnectIds && disconnectIds.length > 0) {
      const limit = pLimit(5);
      await Promise.all(
        disconnectIds.map((id) =>
          limit(async () => {
            const count = await this.prisma.category.count({
              where: { guessObjects: { some: { id } } },
            });
            if (count === 0) await this.guessObjectService.delete(id);
          }),
        ),
      );
    }

    return updated_category;
  }

  async delete(id: string) {
    const [category] = await this.findFullBy({ ids: [id] });

    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.CATEGORY_NOT_FOUND,
        message: `Category with id ${id} not found`,
      });
    }

    const childrenCount = await this.prisma.category.count({
      where: { parentId: id },
    });
    if (childrenCount > 0) {
      throw new BadRequestException({
        code: ErrorCode.CATEGORY_HAS_CHILDREN,
        message: `Category with id ${id} has children and cannot be deleted`,
      });
    }

    await this.prisma.category.delete({ where: { id } });

    if (category.guessObjects.length > 0) {
      const limit = pLimit(5);
      await Promise.all(
        category.guessObjects.map((guessObject) =>
          limit(async () => {
            const count = await this.prisma.category.count({
              where: { guessObjects: { some: { id: guessObject.id } } },
            });
            if (count === 0)
              await this.guessObjectService.delete(guessObject.id);
          }),
        ),
      );
    }
  }
}
