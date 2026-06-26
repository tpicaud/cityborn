import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorldLocationService } from './world-location.service';

@Module({
  imports: [PrismaModule],
  providers: [WorldLocationService],
  exports: [WorldLocationService],
})
export class WorldLocationModule {}
