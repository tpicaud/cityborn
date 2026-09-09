import { Global, Module } from '@nestjs/common';
import { GameRecordPersistenceModule } from '../game/game-record-persistence.module';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { USER_REPOSITORY } from './repositories/user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Global()
@Module({
  imports: [PrismaClsModule, GameRecordPersistenceModule],
  providers: [
    UserService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
  ],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
