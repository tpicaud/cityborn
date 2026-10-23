import type { Theme, ThemeId } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { ThemeMapper } from '../mappers/theme.mapper';
import type { ThemeRepository } from './theme.repository';

@Injectable()
export class PrismaThemeRepository implements ThemeRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async findAll(): Promise<Theme[]> {
    const themes = await this.txHost.tx.theme.findMany({
      orderBy: { name: 'asc' },
    });
    return themes.map(ThemeMapper.toTheme);
  }

  async findById(id: ThemeId): Promise<Theme | null> {
    const theme = await this.txHost.tx.theme.findUnique({ where: { id } });
    return theme ? ThemeMapper.toTheme(theme) : null;
  }
}
