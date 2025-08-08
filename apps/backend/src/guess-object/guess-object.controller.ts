import { Controller, Get, Query } from '@nestjs/common';
import { GuessObjectService } from './guess-object.service';
import { GuessObjectsResponseDto } from './dto/guess-object.response.dto';

@Controller('guess-objects')
export class GuessObjectController {
    constructor(private readonly guessObjectsService: GuessObjectService) { }

    @Get()
    async getGuessObjectsFromIds(@Query('guessObjectsIds') guessObjectsIds: string | string[]): Promise<GuessObjectsResponseDto> {
        const idsArray = Array.isArray(guessObjectsIds)
            ? guessObjectsIds
            : guessObjectsIds.split(',');

        return {
            guessObjects: await this.guessObjectsService.findSome(idsArray)
        }
    }
}
