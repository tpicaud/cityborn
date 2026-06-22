import { CreateCategory, ErrorCode, UpdateCategory } from '@cityborn/api';
import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Category as PrismaCategory,
  GuessObject as PrismaGuessObject,
} from '@prisma/client';
import pLimit from 'p-limit';
import { GuessObjectService } from '../../guess-object/guess-object.service';
import { PrismaService } from '../../prisma/prisma.service';

export type PrismaCategoryWithGuessObjects = PrismaCategory & {
  guessObjects: PrismaGuessObject[];
};

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guessObjectService: GuessObjectService,
  ) {}

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
  }): Promise<PrismaCategoryWithGuessObjects[]> {
    return this.prisma.category.findMany({
      where: {
        ...(filter.ids && { id: { in: filter.ids } }),
        ...(filter.isPublished !== undefined && {
          isPublished: filter.isPublished,
        }),
      },
      include: { guessObjects: true },
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
    const { guessObjectsIds, connectIds, disconnectIds, id, ...categoryData } =
      data;

    const relationUpdate: any = {};
    if (guessObjectsIds) {
      relationUpdate.set = guessObjectsIds.map((id) => ({ id }));
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
      include: { guessObjects: true },
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
