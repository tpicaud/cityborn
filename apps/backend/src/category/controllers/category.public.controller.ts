import { contract, ErrorCode } from '@cityborn/api';
import { Controller, NotFoundException } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { PublicCategoryService } from '../services/category.public.service';

@Controller()
export class PublicCategoryController {
  constructor(private readonly publicCategoryService: PublicCategoryService) {}

  @TsRestHandler(contract.category)
  async handler() {
    return tsRestHandler(contract.category, {
      getCategoryTrees: async () => ({
        status: 200 as const,
        body: await this.publicCategoryService.getTrees(),
      }),

      getCategories: async () => {
        return {
          status: 200 as const,
          body: await this.publicCategoryService.findAll(),
        };
      },
      getCategory: async ({ params }) => {
        const [category] = await this.publicCategoryService.findBy({
          ids: [params.id],
        });
        if (!category) {
          throw new NotFoundException({
            code: ErrorCode.CATEGORY_NOT_FOUND,
            message: 'Category not found',
          });
        }
        return { status: 200 as const, body: category };
      },
    });
  }
}
