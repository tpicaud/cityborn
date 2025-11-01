import { Body, Delete, Param, Post, Put, UseGuards } from "@nestjs/common";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { CategoryDto } from "../dto/category.dto";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { UpdateCategoryDto } from "../dto/update-category.dto";
import { AdminCategoryService } from "../services/category.admin.service";

@UseGuards(AdminGuard)
export class AdminCategoryController {
    constructor(private readonly adminCategoryService: AdminCategoryService) { }

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