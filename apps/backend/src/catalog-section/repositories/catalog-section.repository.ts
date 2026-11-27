import type { CatalogSection, CatalogSectionId } from '@cityborn/api';

export const CATALOG_SECTION_REPOSITORY = Symbol('CATALOG_SECTION_REPOSITORY');

export class CatalogSectionNameAlreadyExistsError extends Error {}

export interface CatalogSectionRepository {
  lockOrder(): Promise<void>;
  findAll(): Promise<CatalogSection[]>;
  findPlayable(): Promise<CatalogSection[]>;
  create(name: string): Promise<CatalogSection>;
  rename(data: {
    id: CatalogSectionId;
    name: string;
  }): Promise<CatalogSection | null>;
  reorder(ids: CatalogSectionId[]): Promise<void>;
  delete(id: CatalogSectionId): Promise<boolean>;
}
