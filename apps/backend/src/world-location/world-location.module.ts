import { Module } from '@nestjs/common';
import { WorldLocationController } from './world-location.controller';
import { WorldLocationService } from './world-location.service';

@Module({
  controllers: [WorldLocationController],
  providers: [WorldLocationService]
})
export class WorldLocationModule {}
