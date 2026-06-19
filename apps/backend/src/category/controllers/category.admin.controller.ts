import { contract } from '@cityborn/api';
import { Controller, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { AdminCategoryService } from '../services/category.admin.service';

@UseGuards(AdminGuard)
@Controller()
export class AdminCategoryController {
  constructor(private readonly adminCategoryService: AdminCategoryService) {}

  @TsRestHandler(contract.admin.category)
  async handler() {
    return tsRestHandler(contract.admin.category, {
      listCategories: async ({ query }) => {
        const includes = query.include
          ? query.include.split(',').map((i) => i.trim())
          : [];
        return {
          status: 200 as const,
          body: await this.adminCategoryService.findAll({ includes }),
        };
      },
      getCategory: async ({ params, query }) => {
        const includes = query.include
          ? query.include.split(',').map((i) => i.trim())
          : [];
        return {
          status: 200 as const,
          body: await this.adminCategoryService.findOne(params.id, {
            includes,
          }),
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
