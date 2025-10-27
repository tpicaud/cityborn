import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { GuessObjectService } from './guess-object.service';
import { GuessObjectsResponseDto } from './dto/guess-object.response.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateGuessObjectDto, CreateGuessObjectResponseDto } from './dto/create-guess-object.dto';
import { GuessObjectCandidateDto, GuessObjectsSearchResponseDto } from './dto/search-guess-object.response.dto';
import { ErrorCode } from '@cityborn/errors';

@Controller('guess-objects')
export class GuessObjectController {
    constructor(
        private readonly guessObjectsService: GuessObjectService
    ) { }


    @UseGuards(AuthGuard)
    @Get()
    async getGuessObjectsFromIds(
        @Query('guessObjectsIds') guessObjectsIds: string | string[],
    ): Promise<GuessObjectsResponseDto> {

        const idsArray = Array.isArray(guessObjectsIds)
            ? guessObjectsIds
            : guessObjectsIds.split(',');

        return {
            guessObjects: await this.guessObjectsService.findSome(idsArray)
        };
    }

    @Get('search')
    async search(
        @Query('q') q?: string,
        @Query('id') id?: string,
    ): Promise<GuessObjectCandidateDto | GuessObjectsSearchResponseDto> {
        if (id) {
            return await this.guessObjectsService.findBySourceId(id);
        } else if (q) {
            return await this.guessObjectsService.searchByName(q);
        } else {
            throw new BadRequestException({
                code: ErrorCode.BAD_REQUEST,
                message: `Either 'q' or 'id' must be provided`,
            });
        }
    }


    @Post()
    async createGuessObject(@Body() createGuessObjectDto: CreateGuessObjectDto): Promise<CreateGuessObjectResponseDto> {
        return {
            id: await this.guessObjectsService.create(createGuessObjectDto)
        }
    }

    @Delete(':id')
    async deleteGuessObjects(@Param('id') id: string): Promise<void> {
        await this.guessObjectsService.delete(id);
    }
}
