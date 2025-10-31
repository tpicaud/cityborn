import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ErrorCode } from '@cityborn/errors';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoriesResponseDto } from './dto/categories.response.dto';
import { CategoryDto } from './dto/category.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { OptionalAdminGuard } from 'src/auth/guards/optional-admin.guard';

@Controller('category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @UseGuards(OptionalAdminGuard)
    @Get()
    async findAllPublished(
        @Req() req,
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
        return this.categoryService.findAll({ includes, include_published: req.admin });
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
        return this.categoryService.findOne(id, includes);
    }


    ////////////////
    // Admin only //
    ////////////////

    @UseGuards(AdminGuard)
    @Post()
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        return this.categoryService.create(createCategoryDto);
    }

    @UseGuards(AdminGuard)
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updatedCategory: UpdateCategoryDto,
    ) {
        return this.categoryService.update(id, updatedCategory);
    }

    @UseGuards(AdminGuard)
    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.categoryService.delete(id);
    }
}
