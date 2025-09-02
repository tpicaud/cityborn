import { Body, Controller, Get, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { GameResponseDto } from './dto/game.response.dto';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';
import { CurrentUser } from 'src/user/user.decorator';
import { GameMode } from '@cityborn/types';
import { ErrorCode } from '@cityborn/errors';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService) { }

    @UseGuards(OptionalAuthGuard)
    @Post()
    async createGame(@Body() createGameDto: CreateGameDto, @CurrentUser() user: any): Promise<GameResponseDto> {
        if (!user && createGameDto.gameMode === GameMode.MULTI) throw new UnauthorizedException({ code: ErrorCode.USER_NO_ACCOUNT, message: 'User does not have an account' });
        return {
            game: await this.gameService.create(createGameDto)
        }
    }

    // @Get(':gameId')
    // async getGame(@Param('gameId') gameId: string): Promise<GameResponseDto> {
    //     return {
    //         game: await this.gameService.get(gameId)
    //     }
    // }
}
