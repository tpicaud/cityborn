import { ErrorCode } from '@cityborn/errors';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryMapper } from './mappers/category.mapper';

@Injectable()
export class CategoryService {
    constructor(private readonly prisma: PrismaService) { }

    private buildInclude(includes: string[]) {
        const include: any = {};
        if (includes.includes('guessObjects')) {
            include.guessObjects = {};
            if (includes.includes('world_location')) {
                include.guessObjects.include = { world_location: true };
            }
        }
        return include;
    }

    async findAll(includes: string[] = []) {
        const categories = await this.prisma.category.findMany({
            include: this.buildInclude(includes),
        });

        return CategoryMapper.toCategoriesResponseDto(categories);
    }

    async findOne(id: string, includes: string[] = []) {
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

        return CategoryMapper.toCategoryDto(category);
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

        return CategoryMapper.toCategoryDto(category);
    }

    async update(categoryId: string, data: UpdateCategoryDto) {
        const { guessObjectIds, connectIds, disconnectIds, id, ...categoryData } = data;

        const relationUpdate: any = {};

        if (guessObjectIds) {
            relationUpdate.set = guessObjectIds.map((id) => ({ id }));
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
        return CategoryMapper.toCategoryDto(updated_category);
    }


    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.category.delete({
            where: { id },
        });
    }
}
