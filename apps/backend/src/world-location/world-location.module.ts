import { Module } from '@nestjs/common';
import { WorldLocationController } from './world-location.controller';
import { WorldLocationService } from './world-location.service';
import { NominatimModule } from 'src/nominatim/nominatim.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [NominatimModule, PrismaModule],
  controllers: [WorldLocationController],
  providers: [WorldLocationService],
  exports: [WorldLocationService]
})
export class WorldLocationModule {}
