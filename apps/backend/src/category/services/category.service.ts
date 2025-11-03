import { ErrorCode } from '@cityborn/errors';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { GuessObjectService } from 'src/guess-object/guess-object.service';
import pLimit from 'p-limit';

@Injectable()
export class CategoryService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly guessObjectService: GuessObjectService
    ) { }

    private buildInclude(includes: string[]) {
        const include: any = {};

        if (includes.includes('guessObjects')) {
            include.guessObjects = {};

            if (includes.includes('world_location')) {
                include.guessObjects.include = { world_location: true };
            }

            if (includes.includes('world_location_preview')) {
                include.guessObjects.include = {
                    world_location: {
                        select: {
                            id: true,
                            osm_type: true,
                            name: true,
                            display_name: true,
                        },
                    },
                };
            }
        }

        return include;
    }


    async findAll({
        includes = [],
    }: {
        includes?: string[],
    }) {
        const categories = await this.prisma.category.findMany({
            include: this.buildInclude(includes),
        });

        return categories;
    }

    async findOne(id: string, {
        includes = []
    }: {
        includes: string[]
    }) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: this.buildInclude(includes),
        });

        if (!category) {
            throw new NotFoundException({
                code: ErrorCode.CATEGORY_NOT_FOUND,
                message: `Category with id ${id} not found`
            });
        }

        return category;
    }

    async create(data: CreateCategoryDto) {
        const { guessObjectIds, ...categoryData } = data;

        const category = await this.prisma.category.create({
            data: {
                ...categoryData,
                guessObjects: guessObjectIds
                    ? {
                        connect: guessObjectIds.map(id => ({ id }))
                    } : undefined
            },
        });

        return category
    }

    async update(categoryId: string, data: UpdateCategoryDto) {
        const { guessObjectsIds, connectIds, disconnectIds, id, ...categoryData } = data;

        const relationUpdate: any = {};

        if (guessObjectsIds) {
            relationUpdate.set = guessObjectsIds.map((id) => ({ id }));
        } else {
            if (connectIds) {
                relationUpdate.connect = connectIds.map((id) => ({ id }));
            }
            if (disconnectIds) {
                relationUpdate.disconnect = disconnectIds.map((id) => ({ id }));
            }
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

        // Delete guess objects
        if (disconnectIds && disconnectIds.length >= 0) {
            const limit = pLimit(5);

            await Promise.all(
                disconnectIds.map((id) =>
                    limit(async () => {
                        const count = await this.prisma.category.count({
                            where: { guessObjects: { some: { id } } },
                        });

                        if (count === 0) {
                            await this.guessObjectService.delete(id);
                        }
                    })
                )
            );
        }

        return updated_category;
    }


    async delete(id: string) {
        // Check if exist
        const category = await this.findOne(id, {
            includes: ['guessObjects']
        });

        // Delete
        await this.prisma.category.delete({
            where: { id },
        });

        // Delete guess objects if orphelin
        if (category.guessObjects && category.guessObjects.length >= 0) {
            const limit = pLimit(5);

            await Promise.all(
                category.guessObjects.map((guessObject) =>
                    limit(async () => {
                        const count = await this.prisma.category.count({
                            where: { guessObjects: { some: { id: guessObject.id } } },
                        });

                        if (count === 0) {
                            await this.guessObjectService.delete(guessObject.id);
                        }
                    })
                )
            );
        }
    }
}
