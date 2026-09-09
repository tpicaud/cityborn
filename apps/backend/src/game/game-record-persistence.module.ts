import { Module } from '@nestjs/common';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { GAME_RECORD_REPOSITORY } from './repositories/game-record.repository';
import { PrismaGameRecordRepository } from './repositories/prisma-game-record.repository';

@Module({
  imports: [PrismaClsModule],
  providers: [
    {
      provide: GAME_RECORD_REPOSITORY,
      useClass: PrismaGameRecordRepository,
    },
  ],
  exports: [GAME_RECORD_REPOSITORY],
})
export class GameRecordPersistenceModule {}
