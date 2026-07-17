import { contract, ErrorCode } from '@cityborn/api';
import { Controller, NotFoundException, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { GuessObjectService } from '../guess-object.service';

@UseGuards(AdminGuard)
@Controller()
export class AdminGuessObjectController {
  constructor(private readonly guessObjectsService: GuessObjectService) {}

  @TsRestHandler(contract.admin.guessObjects)
  async handler() {
    return tsRestHandler(contract.admin.guessObjects, {
      getGuessObject: async ({ params }) => {
        const [guessObject] = await this.guessObjectsService.findBy({
          ids: [params.id],
        });
        if (!guessObject) {
          throw new NotFoundException({
            code: ErrorCode.GUESS_OBJECTS_NOT_FOUND,
            message: 'GuessObject not found',
          });
        }
        return { status: 200 as const, body: guessObject };
      },

      getGuessObjects: async ({ query }) => {
        const idsArray = query.guessObjectsIds.split(',');
        return {
          status: 200 as const,
          body: await this.guessObjectsService.findBy({ ids: idsArray }),
        };
      },

      getFullGuessObject: async ({ params }) => {
        const [guessObject] = await this.guessObjectsService.findFullBy({
          ids: [params.id],
        });
        if (!guessObject) {
          throw new NotFoundException({
            code: ErrorCode.GUESS_OBJECTS_NOT_FOUND,
            message: 'GuessObject not found',
          });
        }
        return { status: 200 as const, body: guessObject };
      },

      getFullGuessObjects: async ({ query }) => {
        const idsArray = query.guessObjectsIds.split(',');
        return {
          status: 200 as const,
          body: await this.guessObjectsService.findFullBy({ ids: idsArray }),
        };
      },

      createGuessObject: async ({ body }) => {
        return {
          status: 201 as const,
          body: await this.guessObjectsService.create(body),
        };
      },

      updateGuessObject: async ({ params, body }) => {
        return {
          status: 200 as const,
          body: await this.guessObjectsService.update(params.id, body),
        };
      },

      deleteGuessObject: async ({ params }) => {
        await this.guessObjectsService.delete(params.id);
        return { status: 200 as const, body: {} };
      },
    });
  }
}
