import { Body, Controller, Get, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { GameResponseDto } from './dto/game.response.dto';
import { OptionalAuthGuard } from 'src/auth/optional-auth.guard';
import { CurrentUser } from 'src/user/user.decorator';
import { GameMode } from '@cityborn/types';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService) { }

    @UseGuards(OptionalAuthGuard)
    @Post()
    async createGame(@Body() createGameDto: CreateGameDto, @CurrentUser() user: any): Promise<GameResponseDto> {
        if (!user && createGameDto.gameMode === GameMode.MULTI) throw new UnauthorizedException();
        return {
            game: await this.gameService.create(createGameDto)
        }
    }

    @Get(':gameId')
    async getGame(@Param('gameId') gameId: string): Promise<GameResponseDto> {
        return {
            game: await this.gameService.get(gameId)
        }
    }
}
