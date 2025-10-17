import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { GuessObjectService } from './guess-object.service';
import { GuessObjectsResponseDto } from './dto/guess-object.response.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateGuessObjectDto } from './dto/create-guess-object.dto';
import { ErrorCode } from '@cityborn/errors';

@Controller('guess-objects')
export class GuessObjectController {
    constructor(private readonly guessObjectsService: GuessObjectService) { }


    @UseGuards(AuthGuard)
    @Get()
    async getGuessObjectsFromIds(
        @Query('guessObjectsIds') guessObjectsIds?: string | string[],
        @Query('q') query?: string,
    ): Promise<GuessObjectsResponseDto> {

        if (guessObjectsIds) {
            const idsArray = Array.isArray(guessObjectsIds)
                ? guessObjectsIds
                : guessObjectsIds.split(',');

            return {
                guessObjects: await this.guessObjectsService.findSome(idsArray)
            };
        }

        if (query) {
            return {
                guessObjects: await this.guessObjectsService.searchByName(query)
            }
        }

        throw new BadRequestException({
            code: ErrorCode.BAD_REQUEST,
            message: `guessObjectsIds of q parameter is invalid`,
        });
    }

    @Post()
    async createGuessObject(@Body() createGuessObjectDto: CreateGuessObjectDto): Promise<string> {
        return await this.guessObjectsService.create(createGuessObjectDto);
    }

    @Delete('id')
    async deleteGuessObjects(@Param() id: string): Promise<void> {
        return await this.guessObjectsService.delete(id);
    }
}
