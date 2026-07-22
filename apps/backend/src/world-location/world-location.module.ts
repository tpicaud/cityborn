import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminWorldLocationController } from './controllers/world-location.admin.controller';
import { WorldLocationService } from './world-location.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminWorldLocationController],
  providers: [WorldLocationService],
  exports: [WorldLocationService],
})
export class WorldLocationModule {}
