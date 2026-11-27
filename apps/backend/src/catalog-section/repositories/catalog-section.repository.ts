import type {
  CatalogSection,
  CatalogSectionId,
  CreateCatalogSection,
  PackId,
} from '@cityborn/api';

export const CATALOG_SECTION_REPOSITORY = Symbol('CATALOG_SECTION_REPOSITORY');

export class CatalogSectionNameAlreadyExistsError extends Error {}

export interface CatalogSectionRepository {
  lockOrder(): Promise<void>;
  findAll(): Promise<CatalogSection[]>;
  findPlayable(): Promise<CatalogSection[]>;
  create(section: CreateCatalogSection): Promise<CatalogSection>;
  rename(data: {
    id: CatalogSectionId;
    name: string;
  }): Promise<CatalogSection | null>;
  reorder(ids: CatalogSectionId[]): Promise<void>;
  delete(id: CatalogSectionId): Promise<boolean>;
  addPack(data: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<CatalogSection | null>;
  removePack(data: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<CatalogSection | null>;
  lockPacks(id: CatalogSectionId): Promise<CatalogSection | null>;
  lockPack(packId: PackId): Promise<void>;
  reorderPacks(data: {
    id: CatalogSectionId;
    packIds: PackId[];
  }): Promise<void>;
}
