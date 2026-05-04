import { contract } from '@cityborn/api';
import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { PublicCategoryService } from '../services/category.public.service';

@Controller()
export class PublicCategoryController {
  constructor(private readonly publicCategoryService: PublicCategoryService) {}

  @TsRestHandler(contract.category)
  async handler() {
    return tsRestHandler(contract.category, {
      getCategories: async ({ query }) => {
        const includes = query.include ? query.include.split(',').map((i) => i.trim()) : [];
        return { status: 200 as const, body: await this.publicCategoryService.findAll({ includes }) };
      },
      getCategory: async ({ params, query }) => {
        const includes = query.include ? query.include.split(',').map((i) => i.trim()) : [];
        return { status: 200 as const, body: await this.publicCategoryService.findOne(params.id, { includes }) };
      },
    });
  }
}
