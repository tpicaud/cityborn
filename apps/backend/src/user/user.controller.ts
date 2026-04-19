import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import type { CreateGameRecordDto } from 'src/session/dto/create-game.dto';
import type { GameRecordsResponseDto } from 'src/session/dto/game.response.dto';
import type { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('game-records')
  @UseGuards(AuthGuard)
  async getGameRecords(@Request() req): Promise<GameRecordsResponseDto> {
    return this.userService.getGameRecords(req.user.id);
  }

  @Post('game-records')
  @UseGuards(AuthGuard)
  async saveSoloGameRecord(
    @Request() req,
    @Body() createGameRecordDto: CreateGameRecordDto,
  ): Promise<void> {
    return this.userService.saveSoloGameRecord(
      req.user.id,
      createGameRecordDto,
    );
  }
}
