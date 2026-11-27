import type { AdminTheme, Theme, ThemeIcon, ThemeId } from '@cityborn/api';
import type { OrderedNamedListRepository } from '../../ordered-list/ordered-named-list';
export const THEME_REPOSITORY = Symbol('THEME_REPOSITORY');
export class ThemeHasPacksError extends Error {}
export interface ThemeRepository
  extends OrderedNamedListRepository<AdminTheme> {
  findPlayable(): Promise<Theme[]>;
  findById(id: ThemeId): Promise<Theme | null>;
  create(data: { name: string; icon: ThemeIcon }): Promise<Theme>;
  update(data: {
    id: ThemeId;
    theme: { name: string; icon?: ThemeIcon };
  }): Promise<Theme>;
  countPacks(id: ThemeId): Promise<number>;
  delete(id: ThemeId): Promise<void>;
}
