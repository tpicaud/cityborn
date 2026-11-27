import type {
  CatalogSection,
  CatalogSectionId,
  CreateCatalogSection,
  PackId,
} from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@prisma/client';
import { PrismaOrderedNamedList } from '../../ordered-list/prisma-ordered-named-list';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { defaultCatalogSectionId } from '../default-catalog-section';
import {
  CatalogSectionMapper,
  type PrismaCatalogSectionWithPacks,
} from '../mappers/catalog-section.mapper';
import type { CatalogSectionRepository } from './catalog-section.repository';

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
  private readonly orderedSections: PrismaOrderedNamedList<Prisma.CatalogSectionWhereInput>;

  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {
    this.orderedSections = new PrismaOrderedNamedList({
      txHost,
      table: Prisma.ModelName.CatalogSection,
      model: (tx) => tx.catalogSection,
    });
  }

  async lockOrder(): Promise<void> {
    await this.orderedSections.lockOrder();
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

  async create({
    name,
    themeId,
  }: CreateCatalogSection): Promise<CatalogSection> {
    const section: PrismaCatalogSectionWithPacks =
      await this.orderedSections.append({
        where: { themeId },
        create: (position) =>
          this.txHost.tx.catalogSection.create({
            data: { name, themeId, position },
            include: sectionPacks,
          }),
      });
    return CatalogSectionMapper.toCatalogSection(section);
  }

  async rename({
    id,
    name,
  }: {
    id: CatalogSectionId;
    name: string;
  }): Promise<CatalogSection | null> {
    try {
      const section: PrismaCatalogSectionWithPacks =
        await this.orderedSections.save(() =>
          this.txHost.tx.catalogSection.update({
            where: { id },
            data: { name },
            include: sectionPacks,
          }),
        );
      return CatalogSectionMapper.toCatalogSection(section);
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
    await this.orderedSections.reorder(ids);
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
    if (!(await this.lockSection(id))) return null;
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

  async lockPacks(id: CatalogSectionId): Promise<CatalogSection | null> {
    if (!(await this.lockSection(id))) return null;
    return this.findById(id);
  }

  async lockPack(packId: PackId): Promise<void> {
    await this.txHost.tx.$queryRaw`
      SELECT "id" FROM "Pack" WHERE "id" = ${packId}::uuid FOR SHARE`;
  }

  async reorderPacks({
    id,
    packIds,
  }: {
    id: CatalogSectionId;
    packIds: PackId[];
  }): Promise<void> {
    await Promise.all(
      packIds.map((packId, position) =>
        this.txHost.tx.catalogSectionPack.update({
          where: { sectionId_packId: { sectionId: id, packId } },
          data: { position },
        }),
      ),
    );
  }

  private async lockSection(id: CatalogSectionId): Promise<boolean> {
    const lockedSections: { id: string }[] = await this.txHost.tx.$queryRaw`
      SELECT "id" FROM "CatalogSection" WHERE "id" = ${id}::uuid FOR UPDATE`;
    return lockedSections.length > 0;
  }

  private async findById(id: CatalogSectionId): Promise<CatalogSection | null> {
    const section: PrismaCatalogSectionWithPacks | null =
      await this.txHost.tx.catalogSection.findUnique({
        where: { id },
        include: sectionPacks,
      });
    return section && CatalogSectionMapper.toCatalogSection(section);
  }
}
