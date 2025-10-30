import { BadRequestException, Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GuessObjectService } from './guess-object.service';
import { GuessObjectsResponseDto } from './dto/guess-object.response.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateGuessObjectDto, CreateGuessObjectResponseDto } from './dto/create-guess-object.dto';
import { GuessObjectCandidateDto, GuessObjectsSearchResponseDto } from './dto/search-guess-object.response.dto';
import { ErrorCode } from '@cityborn/errors';
import { GuessObjectDto } from './dto/guess-object.dto';

@Controller('guess-objects')
export class GuessObjectController {
    private readonly logger = new Logger(GuessObjectController.name);

    constructor(
        private readonly guessObjectsService: GuessObjectService
    ) { }

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

    @Get(':id')
    async getGuessObject(
        @Param('id') id: string,
        @Query('include') include?: string,
    ): Promise<GuessObjectDto> {
        let includes: string[];
        try {
            includes = include ? include.split(',').map((i) => i.trim()) : []
        } catch {
            throw new BadRequestException({
                code: ErrorCode.BAD_REQUEST,
                message: "Bad query"
            })
        }
        return await this.guessObjectsService.findById(id, includes);
    }

    @Patch(':id')
    async patchGuessObject(
        @Param('id') id: string,
        @Body() updatedFields: Partial<GuessObjectDto>
    ): Promise<{ id: string }> {
        return {
            id: await this.guessObjectsService.update(id, updatedFields)
        };
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
