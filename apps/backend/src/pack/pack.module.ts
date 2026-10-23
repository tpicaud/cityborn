import { Module } from '@nestjs/common';
import { GuessObjectModule } from '../guess-object/guess-object.module';
import { AdminPackController } from './controllers/pack.admin.controller';
import { PublicPackController } from './controllers/pack.public.controller';
import { PackService } from './pack.service';
import { PackRepositoryModule } from './repositories/pack-repository.module';

@Module({
  imports: [PackRepositoryModule, GuessObjectModule],
  controllers: [PublicPackController, AdminPackController],
  providers: [PackService],
})
export class PackModule {}
