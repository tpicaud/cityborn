import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import {
  PERSISTENCE_CONFIG,
  type PersistenceConfig,
} from '../config/config.module';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Inject(PERSISTENCE_CONFIG) persistenceConfig: PersistenceConfig,
  ) {
    const adapter = new PrismaPg({
      connectionString: persistenceConfig.databaseUrl,
    });
    super({ adapter });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async onModuleInit() {
    await this.$connect();
  }
}
