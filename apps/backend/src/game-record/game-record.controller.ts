import { contract, type User } from '@cityborn/api';
import { Controller, UseGuards } from '@nestjs/common';
import { initContract } from '@ts-rest/core';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { CurrentUser } from '../auth/current-auth-session.decorator';
import { AuthGuard } from '../auth/guards/access-token.guard';
import { GameRecordService } from './game-record.service';

const c = initContract();

const deprecatedUserGameRecordRoutes = c.router({
  getGameRecords: contract.user.getGameRecords,
  saveSoloGameRecord: contract.user.saveSoloGameRecord,
});

@Controller()
export class GameRecordController {
  constructor(private readonly gameRecordService: GameRecordService) {}

  @TsRestHandler(contract.gameRecord)
  @UseGuards(AuthGuard)
  async handler(@CurrentUser() user: User) {
    return tsRestHandler(contract.gameRecord, {
      getGameRecords: async () => ({
        status: 200 as const,
        body: await this.gameRecordService.getGameRecords(user.id),
      }),
      saveSoloGameRecord: async ({ body }) => {
        await this.gameRecordService.saveSoloGameRecord({
          userId: user.id,
          createGameRecord: body,
        });
        return { status: 200 as const, body: {} };
      },
    });
  }

  @TsRestHandler(deprecatedUserGameRecordRoutes)
  @UseGuards(AuthGuard)
  async deprecatedUserHandler(@CurrentUser() user: User) {
    return tsRestHandler(deprecatedUserGameRecordRoutes, {
      getGameRecords: async () => ({
        status: 200 as const,
        body: await this.gameRecordService.getGameRecords(user.id),
      }),
      saveSoloGameRecord: async ({ body }) => {
        await this.gameRecordService.saveSoloGameRecord({
          userId: user.id,
          createGameRecord: body,
        });
        return { status: 200 as const, body: {} };
      },
    });
  }
}
