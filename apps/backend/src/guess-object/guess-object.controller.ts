import { Controller, Get, Query } from '@nestjs/common';
import { GuessObjectService } from './guess-object.service';

@Controller('guess-objects')
export class GuessObjectController {
    constructor(private readonly guessObjectsService: GuessObjectService) { }

    @Get()
    async getGuessObjectsFromIds(@Query('guessObjectsIds') guessObjectsIds: string | string[]) {
        const idsArray = Array.isArray(guessObjectsIds)
            ? guessObjectsIds
            : guessObjectsIds.split(',');

        return await this.guessObjectsService.findSome(idsArray);
    }
}
