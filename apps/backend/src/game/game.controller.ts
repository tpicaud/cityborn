import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { GameResponseDto } from './dto/game.response.dto';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService) {}

        @Post()
        async createGame(@Body() createGameDto: CreateGameDto): Promise<GameResponseDto> {
            return {
                game: await this.gameService.create(createGameDto)
            }
        }
    
        @Get()
        async getGame(@Query('gameId') gameId: string): Promise<GameResponseDto> {
            return {
                game: await this.gameService.get(gameId)
            }
        }
}
