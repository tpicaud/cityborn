import { Module } from '@nestjs/common';
import { GuessObjectModule } from '../guess-object/guess-object.module';
import { AdminPackController } from './controllers/pack.admin.controller';
import { PublicPackController } from './controllers/pack.public.controller';
import { PackRepositoryModule } from './repositories/pack-repository.module';
import { AdminPackService } from './services/pack.admin.service';
import { PublicPackService } from './services/pack.public.service';
import { PackService } from './services/pack.service';

@Module({
  imports: [PackRepositoryModule, GuessObjectModule],
  controllers: [PublicPackController, AdminPackController],
  providers: [PackService, PublicPackService, AdminPackService],
  exports: [PackService, PublicPackService, AdminPackService],
})
export class PackModule {}
