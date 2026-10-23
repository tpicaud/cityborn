import { contract, ErrorCode } from '@cityborn/api';
import { Controller, NotFoundException } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { PackService } from '../pack.service';

function toCategoryNotFound(error: unknown): never {
  if (error instanceof NotFoundException) {
    throw new NotFoundException({
      code: ErrorCode.CATEGORY_NOT_FOUND,
      message: 'Category not found',
    });
  }
  throw error;
}

@Controller()
export class PublicPackController {
  constructor(private readonly packService: PackService) {}

  @TsRestHandler(contract.pack)
  async handler() {
    return tsRestHandler(contract.pack, {
      getPackTrees: async () => ({
        status: 200 as const,
        body: await this.packService.findPublishedTrees(),
      }),

      getPacks: async () => ({
        status: 200 as const,
        body: await this.packService.findPublished(),
      }),

      getPack: async ({ params }) => ({
        status: 200 as const,
        body: await this.packService.findPublishedById(params.id),
      }),
    });
  }

  @TsRestHandler(contract.category)
  async deprecatedCategoryHandler() {
    return tsRestHandler(contract.category, {
      getCategoryTrees: async () => ({
        status: 200 as const,
        body: await this.packService.findPublishedTrees(),
      }),

      getCategories: async () => ({
        status: 200 as const,
        body: await this.packService.findPublished(),
      }),

      getCategory: async ({ params }) => ({
        status: 200 as const,
        body: await this.packService
          .findPublishedById(params.id)
          .catch(toCategoryNotFound),
      }),
    });
  }
}
