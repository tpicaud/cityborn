import { Module } from '@nestjs/common';
import { BackendConfigModule } from '../config/config.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [BackendConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
