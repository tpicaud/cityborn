import type {
  CatalogSection,
  CatalogSectionId,
  CreateCatalogSection,
  PackId,
} from '@cityborn/api';
import type { OrderedNamedListRepository } from '../../ordered-list/ordered-named-list';

export const CATALOG_SECTION_REPOSITORY = Symbol('CATALOG_SECTION_REPOSITORY');

export interface CatalogSectionRepository
  extends OrderedNamedListRepository<CatalogSection> {
  findPlayable(): Promise<CatalogSection[]>;
  create(section: CreateCatalogSection): Promise<CatalogSection>;
  rename(data: {
    id: CatalogSectionId;
    name: string;
  }): Promise<CatalogSection | null>;
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
