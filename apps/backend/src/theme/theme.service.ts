import {
  type AdminTheme,
  ErrorCode,
  type SaveTheme,
  type Theme,
  type ThemeId,
  ThemeMoveDirection,
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
  async findPlayable(): Promise<Theme[]> {
    return this.themeRepository.findPlayable();
  }
  async findById(id: ThemeId): Promise<Theme> {
    const theme: Theme | null = await this.themeRepository.findById(id);
    if (!theme) throw this.themeNotFound();
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
  async move({
    id,
    direction,
  }: {
    id: ThemeId;
    direction: ThemeMoveDirection;
  }): Promise<AdminTheme[]> {
    const themes: AdminTheme[] = await this.themeRepository.findAll();
    const index: number = themes.findIndex((theme) => theme.id === id);
    const movedTheme: AdminTheme | undefined = themes[index];
    if (!movedTheme) throw this.themeNotFound();
    const targetIndex: number =
      direction === ThemeMoveDirection.UP ? index - 1 : index + 1;
    const targetTheme: AdminTheme | undefined = themes[targetIndex];
    if (!targetTheme) return themes;
    const reorderedThemes: AdminTheme[] = themes
      .with(index, targetTheme)
      .with(targetIndex, movedTheme);
    await this.themeRepository.reorder(
      reorderedThemes.map((theme) => theme.id),
    );
    return reorderedThemes;
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
  private themeNotFound(): NotFoundException {
    return new NotFoundException({
      code: ErrorCode.THEME_NOT_FOUND,
      message: 'Theme not found',
    });
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
