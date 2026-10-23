import { contract, ErrorCode } from '@cityborn/api';
import { Controller, NotFoundException } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { PublicPackService } from '../services/pack.public.service';

@Controller()
export class PublicPackController {
  constructor(private readonly publicPackService: PublicPackService) {}

  @TsRestHandler(contract.pack)
  async handler() {
    return tsRestHandler(contract.pack, {
      getPackTrees: async () => ({
        status: 200 as const,
        body: await this.publicPackService.getTrees(),
      }),

      getPacks: async () => {
        return {
          status: 200 as const,
          body: await this.publicPackService.findAll(),
        };
      },
      getPack: async ({ params }) => {
        const [pack] = await this.publicPackService.findBy({
          ids: [params.id],
        });
        if (!pack) {
          throw new NotFoundException({
            code: ErrorCode.PACK_NOT_FOUND,
            message: 'Pack not found',
          });
        }
        return { status: 200 as const, body: pack };
      },
    });
  }

  @TsRestHandler(contract.category)
  async deprecatedCategoryHandler() {
    return tsRestHandler(contract.category, {
      getCategoryTrees: async () => ({
        status: 200 as const,
        body: await this.publicPackService.getTrees(),
      }),

      getCategories: async () => {
        return {
          status: 200 as const,
          body: await this.publicPackService.findAll(),
        };
      },
      getCategory: async ({ params }) => {
        const [pack] = await this.publicPackService.findBy({
          ids: [params.id],
        });
        if (!pack) {
          throw new NotFoundException({
            code: ErrorCode.CATEGORY_NOT_FOUND,
            message: 'Category not found',
          });
        }
        return { status: 200 as const, body: pack };
      },
    });
  }
}
