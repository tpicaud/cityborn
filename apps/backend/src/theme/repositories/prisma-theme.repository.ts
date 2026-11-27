import type { AdminTheme, Theme, ThemeIcon, ThemeId } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma, type Theme as PrismaTheme } from '@prisma/client';
import { PrismaOrderedNamedList } from '../../ordered-list/prisma-ordered-named-list';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { defaultThemeId } from '../default-theme';
import { ThemeMapper } from '../mappers/theme.mapper';
import { ThemeHasPacksError, type ThemeRepository } from './theme.repository';

const themeOrder: Prisma.ThemeOrderByWithRelationInput[] = [
  { position: 'asc' },
  { name: 'asc' },
];

@Injectable()
export class PrismaThemeRepository implements ThemeRepository {
  private readonly orderedThemes: PrismaOrderedNamedList<Prisma.ThemeWhereInput>;
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {
    this.orderedThemes = new PrismaOrderedNamedList({
      txHost,
      table: Prisma.ModelName.Theme,
      model: (tx) => tx.theme,
    });
  }
  async lockOrder(): Promise<void> {
    await this.orderedThemes.lockOrder();
  }
  async findAll(): Promise<AdminTheme[]> {
    const themes: (PrismaTheme & { _count: { packs: number } })[] =
      await this.txHost.tx.theme.findMany({
        include: { _count: { select: { packs: true } } },
        orderBy: themeOrder,
      });
    return themes.map((theme) => ({
      ...ThemeMapper.toTheme(theme),
      packCount: theme._count.packs,
      isDefault: theme.id === defaultThemeId,
    }));
  }
  async findPlayable(): Promise<Theme[]> {
    const themes: PrismaTheme[] = await this.txHost.tx.theme.findMany({
      where: { packs: { some: { isPublished: true } } },
      orderBy: themeOrder,
    });
    return themes.map((theme) => ThemeMapper.toTheme(theme));
  }
  async findById(id: ThemeId): Promise<Theme | null> {
    const theme: PrismaTheme | null = await this.txHost.tx.theme.findUnique({
      where: { id },
    });
    return theme ? ThemeMapper.toTheme(theme) : null;
  }
  async create(data: { name: string; icon: ThemeIcon }): Promise<Theme> {
    const theme: PrismaTheme = await this.orderedThemes.append({
      where: {},
      create: (position) =>
        this.txHost.tx.theme.create({ data: { ...data, position } }),
    });
    return ThemeMapper.toTheme(theme);
  }
  async update({
    id,
    theme,
  }: {
    id: ThemeId;
    theme: { name: string; icon?: ThemeIcon };
  }): Promise<Theme> {
    const updatedTheme: PrismaTheme = await this.orderedThemes.save(() =>
      this.txHost.tx.theme.update({ where: { id }, data: theme }),
    );
    return ThemeMapper.toTheme(updatedTheme);
  }
  async reorder(ids: ThemeId[]): Promise<void> {
    await this.orderedThemes.reorder(ids);
  }
  async countPacks(id: ThemeId): Promise<number> {
    return this.txHost.tx.pack.count({ where: { themeId: id } });
  }
  async delete(id: ThemeId): Promise<void> {
    try {
      await this.txHost.tx.theme.delete({ where: { id } });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      )
        throw new ThemeHasPacksError();
      throw error;
    }
  }
}
