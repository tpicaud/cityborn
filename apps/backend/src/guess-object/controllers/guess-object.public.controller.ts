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
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { GuessObjectDto } from '../dto/guess-object.dto';
import { GuessObjectsResponseDto } from '../dto/guess-object.response.dto';
import { GuessObjectService } from '../guess-object.service';

@Controller('guess-objects')
export class PublicGuessObjectController {
  private readonly logger = new Logger(PublicGuessObjectController.name);

  constructor(private readonly guessObjectsService: GuessObjectService) {}

  @UseGuards(AuthGuard)
  @Get()
  async getGuessObjectsFromIds(
    @Query('guessObjectsIds') guessObjectsIds: string | string[],
  ): Promise<GuessObjectsResponseDto> {
    const idsArray = Array.isArray(guessObjectsIds)
      ? guessObjectsIds
      : guessObjectsIds.split(',');

    return {
      guessObjects: await this.guessObjectsService.findSome(idsArray),
    };
  }

  @Get(':id')
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
