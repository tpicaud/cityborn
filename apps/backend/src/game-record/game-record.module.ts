import { Module } from '@nestjs/common';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { GameRecordService } from './game-record.service';
import { GAME_RECORD_REPOSITORY } from './repositories/game-record.repository';
import { PrismaGameRecordRepository } from './repositories/prisma-game-record.repository';

@Module({
  imports: [PrismaClsModule],
  providers: [
    GameRecordService,
    {
      provide: GAME_RECORD_REPOSITORY,
      useClass: PrismaGameRecordRepository,
    },
  ],
  exports: [GameRecordService],
})
export class GameRecordModule {}
