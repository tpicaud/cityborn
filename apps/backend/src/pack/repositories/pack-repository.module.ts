import { Module } from '@nestjs/common';
import { PrismaClsModule } from '../../prisma/prisma-cls.module';
import { PACK_REPOSITORY } from './pack.repository';
import { PrismaPackRepository } from './prisma-pack.repository';

@Module({
  imports: [PrismaClsModule],
  providers: [{ provide: PACK_REPOSITORY, useClass: PrismaPackRepository }],
  exports: [PACK_REPOSITORY],
})
export class PackRepositoryModule {}
