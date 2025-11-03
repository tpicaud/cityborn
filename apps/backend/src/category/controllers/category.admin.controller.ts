import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { CategoryDto } from "../dto/category.dto";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { UpdateCategoryDto } from "../dto/update-category.dto";
import { AdminCategoryService } from "../services/category.admin.service";
import { ErrorCode } from "@cityborn/errors";
import { CategoriesResponseDto } from "../dto/categories.response.dto";

@UseGuards(AdminGuard)
@Controller('admin/category')
export class AdminCategoryController {
    constructor(private readonly adminCategoryService: AdminCategoryService) { }

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
        return this.adminCategoryService.findAll({ includes });
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
        return await this.adminCategoryService.findOne(id, { includes });
    }

    @Post()
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        return this.adminCategoryService.create(createCategoryDto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updatedCategory: UpdateCategoryDto,
    ) {
        return this.adminCategoryService.update(id, updatedCategory);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.adminCategoryService.delete(id);
    }
}