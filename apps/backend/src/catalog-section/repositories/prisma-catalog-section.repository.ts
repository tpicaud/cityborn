import {
  type CatalogSection,
  type CatalogSectionId,
  type CreateCatalogSection,
  type PackId,
  type ThemeId,
  ThemeIdSchema,
} from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { Prisma } from '@prisma/client';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import {
  type CatalogSectionRow,
  toCatalogSection,
} from '../mappers/catalog-section.mapper';
import type { CatalogSectionRepository } from './catalog-section.repository';

const catalogSectionLockKey: number = 428;
const sectionOrder: Prisma.CatalogSectionOrderByWithRelationInput[] = [
  { position: 'asc' },
  { id: 'asc' },
];
const packOrder: Prisma.CatalogSectionPackOrderByWithRelationInput[] = [
  { position: 'asc' },
  { packId: 'asc' },
];
@Injectable()
export class PrismaCatalogSectionRepository
  implements CatalogSectionRepository
{
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}
  async lock(): Promise<void> {
    await this.txHost.tx
      .$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(${catalogSectionLockKey})`;
  }
  async findAll(publishedOnly: boolean): Promise<CatalogSection[]> {
    const sections: CatalogSectionRow[] =
      await this.txHost.tx.catalogSection.findMany({
        where: publishedOnly
          ? { packs: { some: { pack: { isPublished: true } } } }
          : {},
        include: {
          packs: {
            where: publishedOnly ? { pack: { isPublished: true } } : {},
            orderBy: packOrder,
          },
        },
        orderBy: sectionOrder,
      });
    return sections.map(toCatalogSection);
  }
  async findById(id: CatalogSectionId): Promise<CatalogSection | null> {
    const section: CatalogSectionRow | null =
      await this.txHost.tx.catalogSection.findUnique({
        where: { id },
        include: { packs: { orderBy: packOrder } },
      });
    return section ? toCatalogSection(section) : null;
  }
  async themeExists(id: ThemeId): Promise<boolean> {
    return (await this.txHost.tx.theme.count({ where: { id } })) > 0;
  }
  async findPackForAssignment(
    id: PackId,
  ): Promise<{ themeId: ThemeId } | null> {
    await this.txHost.tx
      .$queryRaw`SELECT id FROM "Pack" WHERE id = ${id}::uuid FOR UPDATE`;
    const pack: { themeId: string } | null =
      await this.txHost.tx.pack.findUnique({
        where: { id },
        select: { themeId: true },
      });
    return pack ? { themeId: ThemeIdSchema.parse(pack.themeId) } : null;
  }
  async create(data: CreateCatalogSection): Promise<CatalogSection> {
    const lastPosition: number | null = (
      await this.txHost.tx.catalogSection.aggregate({
        where: { themeId: data.themeId },
        _max: { position: true },
      })
    )._max.position;
    const section: CatalogSectionRow =
      await this.txHost.tx.catalogSection.create({
        data: { ...data, position: (lastPosition ?? -1) + 1 },
        include: { packs: true },
      });
    return toCatalogSection(section);
  }
  async rename({
    id,
    name,
  }: {
    id: CatalogSectionId;
    name: string;
  }): Promise<CatalogSection> {
    const section: CatalogSectionRow =
      await this.txHost.tx.catalogSection.update({
        where: { id },
        data: { name },
        include: { packs: { orderBy: packOrder } },
      });
    return toCatalogSection(section);
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
  async delete(id: CatalogSectionId): Promise<void> {
    await this.txHost.tx.catalogSection.delete({ where: { id } });
  }
  async addPack({
    id,
    packId,
  }: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<void> {
    const lastPosition: number | null = (
      await this.txHost.tx.catalogSectionPack.aggregate({
        where: { sectionId: id },
        _max: { position: true },
      })
    )._max.position;
    await this.txHost.tx.catalogSectionPack.create({
      data: { sectionId: id, packId, position: (lastPosition ?? -1) + 1 },
    });
  }
  async removePack({
    id,
    packId,
  }: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<void> {
    await this.txHost.tx.catalogSectionPack.deleteMany({
      where: { sectionId: id, packId },
    });
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
}
