import { ErrorCode, type Theme, type ThemeId } from '@cityborn/api';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  THEME_REPOSITORY,
  type ThemeRepository,
} from './repositories/theme.repository';

@Injectable()
export class ThemeService {
  constructor(
    @Inject(THEME_REPOSITORY)
    private readonly themeRepository: ThemeRepository,
  ) {}

  async findAll(): Promise<Theme[]> {
    return this.themeRepository.findAll();
  }

  async findById(id: ThemeId): Promise<Theme> {
    const theme: Theme | null = await this.themeRepository.findById(id);
    if (!theme) {
      throw new NotFoundException({
        code: ErrorCode.THEME_NOT_FOUND,
        message: `Theme with id ${id} not found`,
      });
    }
    return theme;
  }
}
