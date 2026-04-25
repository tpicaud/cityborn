import { contract } from '@cityborn/api';
import { ErrorCode } from '@cityborn/errors';
import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { GuessObjectDto } from '../dto/guess-object.dto';
import { GuessObjectService } from '../guess-object.service';

@Controller()
export class PublicGuessObjectController {
  private readonly logger = new Logger(PublicGuessObjectController.name);

  constructor(private readonly guessObjectsService: GuessObjectService) {}

  @TsRestHandler(contract.guessObjects.getGuessObjects)
  @UseGuards(AuthGuard)
  async getGuessObjectsFromIds() {
    return tsRestHandler(contract.guessObjects.getGuessObjects, async ({ query }) => {
      const idsArray = query.guessObjectsIds.split(',');
      return {
        status: 200 as const,
        body: { guessObjects: await this.guessObjectsService.findSome(idsArray) },
      };
    });
  }

  @Get('guess-objects/:id')
  async getGuessObject(
    @Param('id') id: string,
    @Query('include') include?: string,
  ): Promise<GuessObjectDto> {
    let includes: string[];
    try {
      includes = include ? include.split(',').map((i) => i.trim()) : [];
    } catch {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Bad query',
      });
    }
    return await this.guessObjectsService.findById(id, includes);
  }
}
