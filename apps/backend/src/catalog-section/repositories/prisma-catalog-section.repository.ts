import type { CatalogSection, CatalogSectionId, PackId } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@prisma/client';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { defaultCatalogSectionId } from '../default-catalog-section';
import {
  CatalogSectionMapper,
  type PrismaCatalogSectionWithPacks,
} from '../mappers/catalog-section.mapper';
import {
  CatalogSectionNameAlreadyExistsError,
  type CatalogSectionRepository,
} from './catalog-section.repository';

const catalogSectionOrder: Prisma.CatalogSectionOrderByWithRelationInput[] = [
  { position: 'asc' },
  { name: 'asc' },
];

const sectionPacks = {
  packs: { select: { packId: true }, orderBy: { position: 'asc' } },
} satisfies Prisma.CatalogSectionInclude;

const publishedPack: Prisma.CatalogSectionPackWhereInput = {
  pack: { isPublished: true },
};

@Injectable()
export class PrismaCatalogSectionRepository
  implements CatalogSectionRepository
{
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async lockOrder(): Promise<void> {
    await this.txHost.tx
      .$executeRaw`LOCK TABLE "CatalogSection" IN SHARE ROW EXCLUSIVE MODE`;
  }

  async findAll(): Promise<CatalogSection[]> {
    const sections: PrismaCatalogSectionWithPacks[] =
      await this.txHost.tx.catalogSection.findMany({
        include: sectionPacks,
        orderBy: catalogSectionOrder,
      });
    return sections.map((section) =>
      CatalogSectionMapper.toCatalogSection(section),
    );
  }

  async findPlayable(): Promise<CatalogSection[]> {
    const sections: PrismaCatalogSectionWithPacks[] =
      await this.txHost.tx.catalogSection.findMany({
        where: {
          OR: [
            { id: defaultCatalogSectionId },
            { packs: { some: publishedPack } },
          ],
        },
        include: { packs: { ...sectionPacks.packs, where: publishedPack } },
        orderBy: catalogSectionOrder,
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
        include: sectionPacks,
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
        this.txHost.tx.catalogSection.update({
          where: { id },
          data: { name },
          include: sectionPacks,
        }),
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

  async addPack({
    id,
    packId,
  }: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<CatalogSection | null> {
    const lockedSections: { id: string }[] = await this.txHost.tx.$queryRaw`
      SELECT "id" FROM "CatalogSection" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (lockedSections.length === 0) return null;
    const lastPosition: number | null = (
      await this.txHost.tx.catalogSectionPack.aggregate({
        where: { sectionId: id },
        _max: { position: true },
      })
    )._max.position;
    await this.txHost.tx.catalogSectionPack.upsert({
      where: { sectionId_packId: { sectionId: id, packId } },
      create: { sectionId: id, packId, position: (lastPosition ?? -1) + 1 },
      update: {},
    });
    return this.findById(id);
  }

  async removePack({
    id,
    packId,
  }: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<CatalogSection | null> {
    await this.txHost.tx.catalogSectionPack.deleteMany({
      where: { sectionId: id, packId },
    });
    return this.findById(id);
  }

  private async findById(id: CatalogSectionId): Promise<CatalogSection | null> {
    const section: PrismaCatalogSectionWithPacks | null =
      await this.txHost.tx.catalogSection.findUnique({
        where: { id },
        include: sectionPacks,
      });
    return section && CatalogSectionMapper.toCatalogSection(section);
  }

  private async save(
    write: () => Promise<PrismaCatalogSectionWithPacks>,
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
