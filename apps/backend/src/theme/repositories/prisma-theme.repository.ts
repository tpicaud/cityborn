import type { AdminTheme, SaveTheme, Theme, ThemeId } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma, type Theme as PrismaTheme } from '@prisma/client';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { defaultThemeId } from '../default-theme';
import { ThemeMapper } from '../mappers/theme.mapper';
import {
  ThemeHasPacksError,
  ThemeNameAlreadyExistsError,
  type ThemeRepository,
} from './theme.repository';
@Injectable()
export class PrismaThemeRepository implements ThemeRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}
  async findAll(): Promise<AdminTheme[]> {
    const themes: (PrismaTheme & { _count: { packs: number } })[] =
      await this.txHost.tx.theme.findMany({
        include: { _count: { select: { packs: true } } },
        orderBy: { name: 'asc' },
      });
    return themes.map((theme) => ({
      ...ThemeMapper.toTheme(theme),
      packCount: theme._count.packs,
      isDefault: theme.id === defaultThemeId,
    }));
  }
  async findById(id: ThemeId): Promise<Theme | null> {
    const theme: PrismaTheme | null = await this.txHost.tx.theme.findUnique({
      where: { id },
    });
    return theme ? ThemeMapper.toTheme(theme) : null;
  }
  async create(data: SaveTheme): Promise<Theme> {
    return this.save(() => this.txHost.tx.theme.create({ data }));
  }
  async update({
    id,
    theme,
  }: {
    id: ThemeId;
    theme: SaveTheme;
  }): Promise<Theme> {
    return this.save(() =>
      this.txHost.tx.theme.update({ where: { id }, data: theme }),
    );
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
  private async save(write: () => Promise<PrismaTheme>): Promise<Theme> {
    try {
      return ThemeMapper.toTheme(await write());
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ThemeNameAlreadyExistsError();
      throw error;
    }
  }
}
