import { contract, ErrorCode } from '@cityborn/api';
import { Controller, NotFoundException } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { GuessObjectService } from '../guess-object.service';

@Controller()
export class PublicGuessObjectController {
  constructor(private readonly guessObjectsService: GuessObjectService) {}

  @TsRestHandler(contract.guessObjects)
  async handler() {
    return tsRestHandler(contract.guessObjects, {
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
    });
  }
}
