import { Controller, Get, UseGuards, Request, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { GameRecordsResponseDto } from 'src/session/dto/game.response.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { GameRecordDto } from 'src/session/dto/game.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('game-records')
    @UseGuards(AuthGuard)
    async getGameRecords(@Request() req): Promise<GameRecordsResponseDto> {
        return this.userService.getGameRecords(req.user.sub);
    }

    @Post('game-records')
    @UseGuards(AuthGuard)
    async saveSoloGameRecord(@Request() req, @Body() gameRecordDto: GameRecordDto): Promise<void> {
        return this.userService.saveSoloGameRecord(req.user.sub, gameRecordDto);
    }

}
