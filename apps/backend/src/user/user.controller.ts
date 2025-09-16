import { Controller, Get, UseGuards, Request, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { GameRecordsResponseDto } from 'src/session/dto/game.response.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { GameRecordDto } from 'src/session/dto/game.dto';
import { CreateGameRecordDto } from 'src/session/dto/create-game.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('game-records')
    @UseGuards(AuthGuard)
    async getGameRecords(@Request() req): Promise<GameRecordsResponseDto> {
        return this.userService.getGameRecords(req.user.id);
    }

    @Post('game-records')
    @UseGuards(AuthGuard)
    async saveSoloGameRecord(@Request() req, @Body() createGameRecordDto: CreateGameRecordDto): Promise<void> {
        return this.userService.saveSoloGameRecord(req.user.id, createGameRecordDto);
    }

}
