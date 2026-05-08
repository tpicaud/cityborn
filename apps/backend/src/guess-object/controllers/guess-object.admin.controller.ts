import { contract } from '@cityborn/api';
import { Controller, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { GuessObjectService } from '../guess-object.service';

@UseGuards(AdminGuard)
@Controller()
export class AdminGuessObjectController {
  constructor(private readonly guessObjectsService: GuessObjectService) {}

  @TsRestHandler(contract.admin.guessObjects)
  async handler() {
    return tsRestHandler(contract.admin.guessObjects, {
      listGuessObjects: async ({ query }) => {
        const idsArray = query.guessObjectsIds.split(',');
        return {
          status: 200 as const,
          body: await this.guessObjectsService.findSome(idsArray),
        };
      },
      getGuessObject: async ({ params, query }) => {
        const includes = query.include ? query.include.split(',').map((i) => i.trim()) : [];
        return { status: 200 as const, body: await this.guessObjectsService.findById(params.id, includes) };
      },
      createGuessObject: async ({ body }) => {
        return { status: 201 as const, body: await this.guessObjectsService.create(body) };
      },
      updateGuessObject: async ({ params, body }) => {
        return { status: 200 as const, body: await this.guessObjectsService.update(params.id, body) };
      },
      deleteGuessObject: async ({ params }) => {
        await this.guessObjectsService.delete(params.id);
        return { status: 204 as const, body: {} };
      },
    });
  }
}
