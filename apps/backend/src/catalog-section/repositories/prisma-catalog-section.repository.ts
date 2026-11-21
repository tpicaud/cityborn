import type { CatalogSection, CatalogSectionId } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import {
  Prisma,
  type CatalogSection as PrismaCatalogSection,
} from '@prisma/client';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { CatalogSectionMapper } from '../mappers/catalog-section.mapper';
import {
  CatalogSectionNameAlreadyExistsError,
  type CatalogSectionRepository,
} from './catalog-section.repository';

@Injectable()
export class PrismaCatalogSectionRepository
  implements CatalogSectionRepository
{
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async findAll(): Promise<CatalogSection[]> {
    const sections: PrismaCatalogSection[] =
      await this.txHost.tx.catalogSection.findMany({
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
      });
    return sections.map((section) =>
      CatalogSectionMapper.toCatalogSection(section),
    );
  }

  async create(name: string): Promise<CatalogSection> {
    return this.save(async () => {
      const lastPosition: number | null = (
        await this.txHost.tx.catalogSection.aggregate({
          _max: { position: true },
        })
      )._max.position;
      return this.txHost.tx.catalogSection.create({
        data: { name, position: (lastPosition ?? -1) + 1 },
      });
    });
  }

  async rename({
    id,
    name,
  }: {
    id: CatalogSectionId;
    name: string;
  }): Promise<CatalogSection | null> {
    try {
      return await this.save(() =>
        this.txHost.tx.catalogSection.update({ where: { id }, data: { name } }),
      );
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        return null;
      throw error;
    }
  }

  async reorder(ids: CatalogSectionId[]): Promise<void> {
    await Promise.all(
      ids.map((id, position) =>
        this.txHost.tx.catalogSection.update({
          where: { id },
          data: { position },
        }),
      ),
    );
  }

  async delete(id: CatalogSectionId): Promise<boolean> {
    const { count }: Prisma.BatchPayload =
      await this.txHost.tx.catalogSection.deleteMany({ where: { id } });
    return count > 0;
  }

  private async save(
    write: () => Promise<PrismaCatalogSection>,
  ): Promise<CatalogSection> {
    try {
      return CatalogSectionMapper.toCatalogSection(await write());
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new CatalogSectionNameAlreadyExistsError();
      throw error;
    }
  }
}
