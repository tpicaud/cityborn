import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { GameRecordsResponseDto } from 'src/session/dto/game.response.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateGameRecordDto } from 'src/session/dto/create-game.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Delete()
  @UseGuards(AuthGuard)
  async deleteUser(@Request() req): Promise<void> {
    return this.userService.deleteUser(req.user.id);
  }

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
