import { contract, ErrorCode } from '@cityborn/api';
import { Controller, NotFoundException, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { AdminCategoryService } from '../services/category.admin.service';

@UseGuards(AdminGuard)
@Controller()
export class AdminCategoryController {
  constructor(private readonly adminCategoryService: AdminCategoryService) {}

  @TsRestHandler(contract.admin.category)
  async handler() {
    return tsRestHandler(contract.admin.category, {
      getCategory: async ({ params }) => {
        const [category] = await this.adminCategoryService.findBy({
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

      getAllCategories: async () => {
        return {
          status: 200 as const,
          body: await this.adminCategoryService.findAll(),
        };
      },

      getFullCategory: async ({ params }) => {
        return {
          status: 200 as const,
          body: await this.adminCategoryService.findFullBy(params.id),
        };
      },

      createCategory: async ({ body }) => {
        return {
          status: 201 as const,
          body: await this.adminCategoryService.create(body),
        };
      },

      updateCategory: async ({ params, body }) => {
        return {
          status: 200 as const,
          body: await this.adminCategoryService.update(params.id, body),
        };
      },

      deleteCategory: async ({ params }) => {
        await this.adminCategoryService.delete(params.id);
        return { status: 200 as const, body: {} };
      },
    });
  }
}
