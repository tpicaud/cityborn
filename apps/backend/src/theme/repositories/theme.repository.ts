import type { AdminTheme, SaveTheme, Theme, ThemeId } from '@cityborn/api';
export const THEME_REPOSITORY = Symbol('THEME_REPOSITORY');
export class ThemeNameAlreadyExistsError extends Error {}
export class ThemeHasPacksError extends Error {}
export interface ThemeRepository {
  findAll(): Promise<AdminTheme[]>;
  findById(id: ThemeId): Promise<Theme | null>;
  create(data: SaveTheme): Promise<Theme>;
  update(data: { id: ThemeId; theme: SaveTheme }): Promise<Theme>;
  countPacks(id: ThemeId): Promise<number>;
  delete(id: ThemeId): Promise<void>;
}
