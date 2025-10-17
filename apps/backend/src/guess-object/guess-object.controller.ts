import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GuessObjectService } from './guess-object.service';
import { GuessObjectsResponseDto } from './dto/guess-object.response.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateGuessObjectDto } from './dto/create-guess-object.dto';

@Controller('guess-objects')
export class GuessObjectController {
    constructor(private readonly guessObjectsService: GuessObjectService) { }


    @UseGuards(AuthGuard)
    @Get()
    async getGuessObjectsFromIds(@Query('guessObjectsIds') guessObjectsIds: string | string[]): Promise<GuessObjectsResponseDto> {
        const idsArray = Array.isArray(guessObjectsIds)
            ? guessObjectsIds
            : guessObjectsIds.split(',');

        return {
            guessObjects: await this.guessObjectsService.findSome(idsArray)
        }
    }

    @Post()
    async createGuessObject(@Body() createGuessObjectDto: CreateGuessObjectDto): Promise<string> {
        return await this.guessObjectsService.create(createGuessObjectDto);
    }
}
