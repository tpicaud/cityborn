import { contract } from '@cityborn/api';
import type { User } from '@cityborn/types';
import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { CreateGameRecordDto } from 'src/session/dto/create-game.dto';
import { CurrentUser } from './user.decorator';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}
  @TsRestHandler(contract.user)
  async handler(@CurrentUser() user: User) {
    return tsRestHandler(contract.user, {
      getGameRecords: async () => ({
        status: 200 as const,
        body: await this.userService.getGameRecords(user.id),
      }),
      saveSoloGameRecord: async ({ body }: { body: CreateGameRecordDto }) => ({
        status: 201 as const,
        body: await this.userService.saveSoloGameRecord(user.id, body),
      }),
    });
  }
}
