import { contract } from '@cityborn/api';
import { Controller, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { GuessObjectService } from '../guess-object.service';

@Controller()
export class PublicGuessObjectController {
  constructor(private readonly guessObjectsService: GuessObjectService) {}

  @TsRestHandler(contract.guessObjects.getGuessObjects)
  @UseGuards(AuthGuard)
  async getGuessObjectsFromIds() {
    return tsRestHandler(contract.guessObjects.getGuessObjects, async ({ query }) => {
      const idsArray = query.guessObjectsIds.split(',');
      return {
        status: 200 as const,
        body: await this.guessObjectsService.findSome(idsArray),
      };
    });
  }

  @TsRestHandler(contract.guessObjects.getGuessObject)
  async getGuessObject() {
    return tsRestHandler(contract.guessObjects.getGuessObject, async ({ params, query }) => {
      const includes = query.include ? query.include.split(',').map((i) => i.trim()) : [];
      return { status: 200 as const, body: await this.guessObjectsService.findById(params.id, includes) };
    });
  }
}
