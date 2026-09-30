import { contract, User } from '@cityborn/api';
import { Controller, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { CurrentUser } from '../auth/current-auth-session.decorator';
import { AuthGuard } from '../auth/guards/access-token.guard';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}
  @TsRestHandler(contract.user)
  @UseGuards(AuthGuard)
  async handler(@CurrentUser() user: User) {
    return tsRestHandler(contract.user, {
      getGameRecords: async () => ({
        status: 200 as const,
        body: await this.userService.getGameRecords(user.id),
      }),
      saveSoloGameRecord: async ({ body }) => {
        await this.userService.saveSoloGameRecord(user.id, body);
        return { status: 200 as const, body: {} };
      },
      updateUsername: async ({ body }) => ({
        status: 200 as const,
        body: await this.userService.updateUsername(user, body.username),
      }),
    });
  }
}
