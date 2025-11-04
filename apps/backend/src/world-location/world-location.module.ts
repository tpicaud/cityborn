import { Module } from '@nestjs/common';
import { WorldLocationService } from './world-location.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WorldLocationService],
  exports: [WorldLocationService]
})
export class WorldLocationModule {}
