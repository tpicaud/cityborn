import { contract } from '@cityborn/api';
import { ErrorCode } from '@cityborn/errors';
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { CategoryDto } from '../dto/category.dto';
import { PublicCategoryService } from '../services/category.public.service';

@Controller()
export class PublicCategoryController {
  constructor(private readonly publicCategoryService: PublicCategoryService) {}

  @TsRestHandler(contract.category.getCategories)
  async findAll(@Query('include') include?: string) {
    return tsRestHandler(contract.category.getCategories, async () => {
      const includes = include ? include.split(',').map((i) => i.trim()) : [];
      return {
        status: 200 as const,
        body: await this.publicCategoryService.findAll({ includes }),
      };
    });
  }

  @Get('category/:id')
  async findOne(
    @Param('id') id: string,
    @Query('include') include?: string,
  ): Promise<CategoryDto> {
    let includes: string[];
    try {
      includes = include ? include.split(',').map((i) => i.trim()) : [];
    } catch {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Bad query',
      });
    }
    return await this.publicCategoryService.findOne(id, { includes });
  }
}
