import {
  type AdminTheme,
  ErrorCode,
  type SaveTheme,
  type Theme,
  type ThemeId,
} from '@cityborn/api';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { defaultThemeId } from './default-theme';
import {
  THEME_REPOSITORY,
  ThemeHasPacksError,
  ThemeNameAlreadyExistsError,
  type ThemeRepository,
} from './repositories/theme.repository';
@Injectable()
export class ThemeService {
  constructor(
    @Inject(THEME_REPOSITORY) private readonly themeRepository: ThemeRepository,
  ) {}
  async findAll(): Promise<AdminTheme[]> {
    return this.themeRepository.findAll();
  }
  async findById(id: ThemeId): Promise<Theme> {
    const theme: Theme | null = await this.themeRepository.findById(id);
    if (!theme)
      throw new NotFoundException({
        code: ErrorCode.THEME_NOT_FOUND,
        message: 'Theme not found',
      });
    return theme;
  }
  async create(data: SaveTheme): Promise<Theme> {
    return this.save(() => this.themeRepository.create(data));
  }
  async update({
    id,
    theme,
  }: {
    id: ThemeId;
    theme: SaveTheme;
  }): Promise<Theme> {
    await this.findById(id);
    return this.save(() => this.themeRepository.update({ id, theme }));
  }
  @Transactional()
  async delete(id: ThemeId): Promise<void> {
    await this.findById(id);
    if (id === defaultThemeId)
      throw new BadRequestException({
        code: ErrorCode.THEME_DEFAULT_NOT_DELETABLE,
        message: 'Default theme cannot be deleted',
      });
    if ((await this.themeRepository.countPacks(id)) > 0)
      throw new BadRequestException({
        code: ErrorCode.THEME_HAS_PACKS,
        message: 'Theme has packs',
      });
    try {
      await this.themeRepository.delete(id);
    } catch (error: unknown) {
      if (error instanceof ThemeHasPacksError)
        throw new BadRequestException({
          code: ErrorCode.THEME_HAS_PACKS,
          message: 'Theme has packs',
        });
      throw error;
    }
  }
  private async save(write: () => Promise<Theme>): Promise<Theme> {
    try {
      return await write();
    } catch (error: unknown) {
      if (error instanceof ThemeNameAlreadyExistsError)
        throw new ConflictException({
          code: ErrorCode.THEME_NAME_ALREADY_EXISTS,
          message: 'Theme name already exists',
        });
      throw error;
    }
  }
}
