import { Module } from '@nestjs/common';
import {
  ClsPluginTransactional,
  TransactionHost,
} from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import type { PrismaClient } from '@prisma/client';
import { ClsModule } from 'nestjs-cls';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';

export type PrismaTransactionHost = TransactionHost<
  TransactionalAdapterPrisma<PrismaClient>
>;

@Module({
  imports: [
    ClsModule.forRoot({
      middleware: { mount: true },
      plugins: [
        new ClsPluginTransactional({
          imports: [PrismaModule],
          adapter: new TransactionalAdapterPrisma({
            prismaInjectionToken: PrismaService,
            sqlFlavor: 'postgresql',
          }),
        }),
      ],
    }),
  ],
  exports: [ClsModule],
})
export class PrismaClsModule {}
