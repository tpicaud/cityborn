import type { Theme, ThemeId } from '@cityborn/api';

export const THEME_REPOSITORY = Symbol('THEME_REPOSITORY');

export interface ThemeRepository {
  findAll(): Promise<Theme[]>;
  findById(id: ThemeId): Promise<Theme | null>;
}
