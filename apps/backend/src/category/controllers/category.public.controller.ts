import { BadRequestException, Controller, Get, Param, Query, Req } from '@nestjs/common';
import { PublicCategoryService } from '../services/category.public.service';
import { ErrorCode } from '@cityborn/errors';
import { CategoriesResponseDto } from '../dto/categories.response.dto';
import { CategoryDto } from '../dto/category.dto';

@Controller('category')
export class PublicCategoryController {
    constructor(private readonly publicCategoryService: PublicCategoryService) { }

    @Get()
    async findAll(
        @Query('include') include?: string,
    ): Promise<CategoriesResponseDto> {
        let includes: string[];
        try {
            includes = include ? include.split(',').map((i) => i.trim()) : []
        } catch {
            throw new BadRequestException({
                code: ErrorCode.BAD_REQUEST,
                message: "Bad query"
            })
        }
        return this.publicCategoryService.findAll({ includes });
    }

    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @Query('include') include: string
    ): Promise<CategoryDto> {
        let includes: string[];
        try {
            includes = include ? include.split(',').map((i) => i.trim()) : []
        } catch {
            throw new BadRequestException({
                code: ErrorCode.BAD_REQUEST,
                message: "Bad query"
            })
        }
        return await this.publicCategoryService.findOne(id, { includes });
    }
}
