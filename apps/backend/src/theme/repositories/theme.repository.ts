import type { AdminTheme, Theme, ThemeIcon, ThemeId } from '@cityborn/api';
export const THEME_REPOSITORY = Symbol('THEME_REPOSITORY');
export class ThemeNameAlreadyExistsError extends Error {}
export class ThemeHasPacksError extends Error {}
export interface ThemeRepository {
  findAll(): Promise<AdminTheme[]>;
  findPlayable(): Promise<Theme[]>;
  findById(id: ThemeId): Promise<Theme | null>;
  create(data: { name: string; icon: ThemeIcon }): Promise<Theme>;
  update(data: {
    id: ThemeId;
    theme: { name: string; icon?: ThemeIcon };
  }): Promise<Theme>;
  reorder(ids: ThemeId[]): Promise<void>;
  countPacks(id: ThemeId): Promise<number>;
  delete(id: ThemeId): Promise<void>;
}
