import { Module } from '@nestjs/common';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { AdminWorldLocationController } from './controllers/world-location.admin.controller';
import { PrismaWorldLocationRepository } from './repositories/prisma-world-location.repository';
import { WORLD_LOCATION_REPOSITORY } from './repositories/world-location.repository';
import { WorldLocationService } from './world-location.service';

@Module({
  imports: [PrismaClsModule],
  controllers: [AdminWorldLocationController],
  providers: [
    WorldLocationService,
    {
      provide: WORLD_LOCATION_REPOSITORY,
      useClass: PrismaWorldLocationRepository,
    },
  ],
  exports: [WorldLocationService],
})
export class WorldLocationModule {}
