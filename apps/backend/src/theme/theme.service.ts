import {
  type AdminTheme,
  ErrorCode,
  type SaveTheme,
  type Theme,
  type ThemeIcon,
  type ThemeIconName,
  type ThemeId,
  type ThemeMoveDirection,
} from '@cityborn/api';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { IconService } from '../icon/icon.service';
import { OrderedNamedList } from '../ordered-list/ordered-named-list';
import { defaultThemeIcon, defaultThemeId } from './default-theme';
import {
  THEME_REPOSITORY,
  ThemeHasPacksError,
  type ThemeRepository,
} from './repositories/theme.repository';
@Injectable()
export class ThemeService {
  private readonly orderedThemes: OrderedNamedList<AdminTheme>;
  constructor(
    @Inject(THEME_REPOSITORY) private readonly themeRepository: ThemeRepository,
    private readonly iconService: IconService,
  ) {
    this.orderedThemes = new OrderedNamedList({
      repository: themeRepository,
      notFound: () => this.themeNotFound(),
      nameConflict: {
        code: ErrorCode.THEME_NAME_ALREADY_EXISTS,
        message: 'Theme name already exists',
      },
    });
  }
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
  async create({ name, icon }: SaveTheme): Promise<Theme> {
    const themeIcon: ThemeIcon = icon
      ? await this.findIcon(icon)
      : defaultThemeIcon;
    return this.createAtEnd({ name, icon: themeIcon });
  }
  @Transactional()
  private async createAtEnd(theme: {
    name: string;
    icon: ThemeIcon;
  }): Promise<Theme> {
    return this.orderedThemes.append(() => this.themeRepository.create(theme));
  }
  async update({
    id,
    theme,
  }: {
    id: ThemeId;
    theme: SaveTheme;
  }): Promise<Theme> {
    const currentTheme: Theme = await this.findById(id);
    const icon: ThemeIcon | undefined =
      theme.icon && theme.icon !== currentTheme.icon.name
        ? await this.findIcon(theme.icon)
        : undefined;
    return this.orderedThemes.save(() =>
      this.themeRepository.update({ id, theme: { name: theme.name, icon } }),
    );
  }
  @Transactional()
  async move({
    id,
    direction,
  }: {
    id: ThemeId;
    direction: ThemeMoveDirection;
  }): Promise<AdminTheme[]> {
    return this.orderedThemes.move({ id, direction });
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
  private async findIcon(name: ThemeIconName): Promise<ThemeIcon> {
    const svg: string | null = await this.iconService.findSvg(name);
    if (svg === null)
      throw new BadRequestException({
        code: ErrorCode.THEME_ICON_NOT_FOUND,
        message: 'Theme icon not found',
      });
    return { name, svg };
  }
  private themeNotFound(): NotFoundException {
    return new NotFoundException({
      code: ErrorCode.THEME_NOT_FOUND,
      message: 'Theme not found',
    });
  }
}
