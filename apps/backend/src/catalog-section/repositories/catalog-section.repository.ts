import type {
  CatalogSection,
  CatalogSectionId,
  CreateCatalogSection,
  PackId,
  ThemeId,
} from '@cityborn/api';
export const CATALOG_SECTION_REPOSITORY = Symbol('CATALOG_SECTION_REPOSITORY');
export interface CatalogSectionRepository {
  lock(): Promise<void>;
  findAll(publishedOnly: boolean): Promise<CatalogSection[]>;
  findById(id: CatalogSectionId): Promise<CatalogSection | null>;
  themeExists(id: ThemeId): Promise<boolean>;
  findPackForAssignment(id: PackId): Promise<{ themeId: ThemeId } | null>;
  create(data: CreateCatalogSection): Promise<CatalogSection>;
  rename(data: { id: CatalogSectionId; name: string }): Promise<CatalogSection>;
  reorder(ids: CatalogSectionId[]): Promise<void>;
  delete(id: CatalogSectionId): Promise<void>;
  addPack(data: { id: CatalogSectionId; packId: PackId }): Promise<void>;
  removePack(data: { id: CatalogSectionId; packId: PackId }): Promise<void>;
  reorderPacks(data: {
    id: CatalogSectionId;
    packIds: PackId[];
  }): Promise<void>;
}
