import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
