import { contract, User } from '@cityborn/api';
import { Controller, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CurrentUser } from './user.decorator';
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
    });
  }
}
