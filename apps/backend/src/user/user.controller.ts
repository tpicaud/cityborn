import { contract } from '@cityborn/api';
import type { User } from '@cityborn/types';
import { Controller, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import type { CreateGameRecordDto } from 'src/session/dto/create-game.dto';
import { CurrentUser } from './user.decorator';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @TsRestHandler(contract.user.getGameRecords)
  @UseGuards(AuthGuard)
  async getGameRecords(@CurrentUser() user: User) {
    return tsRestHandler(contract.user.getGameRecords, async () => {
      return { status: 200 as const, body: await this.userService.getGameRecords(user.id) };
    });
  }

  @TsRestHandler(contract.user.saveGameRecord)
  @UseGuards(AuthGuard)
  async saveGameRecord(@CurrentUser() user: User) {
    return tsRestHandler(contract.user.saveGameRecord, async ({ body }) => {
      await this.userService.saveSoloGameRecord(user.id, body.gameRecord as unknown as CreateGameRecordDto);
      return { status: 201 as const, body: {} };
    });
  }
}
