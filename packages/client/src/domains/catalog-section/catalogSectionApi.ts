import type {
  CatalogSection,
  CatalogSectionId,
  CreateCatalogSection,
  MoveCatalogSection,
  PackId,
  SaveCatalogSection,
} from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';

type CatalogSectionContractClient = Pick<ContractClient, 'catalogSection'> & {
  admin: Pick<ContractClient['admin'], 'catalogSection'>;
};

export interface CatalogSectionApi {
  getPlayableCatalogSections(): Promise<CatalogSection[]>;
  getCatalogSections(): Promise<CatalogSection[]>;
  createCatalogSection(section: CreateCatalogSection): Promise<CatalogSection>;
  renameCatalogSection(data: {
    id: CatalogSectionId;
    section: SaveCatalogSection;
  }): Promise<CatalogSection>;
  moveCatalogSection(data: {
    id: CatalogSectionId;
    move: MoveCatalogSection;
  }): Promise<CatalogSection[]>;
  deleteCatalogSection(id: CatalogSectionId): Promise<void>;
  addPackToCatalogSection(data: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<CatalogSection>;
  removePackFromCatalogSection(data: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<CatalogSection>;
  movePackInCatalogSection(data: {
    id: CatalogSectionId;
    packId: PackId;
    move: MoveCatalogSection;
  }): Promise<CatalogSection>;
}

export function createCatalogSectionApi(
  contractClient: CatalogSectionContractClient,
): CatalogSectionApi {
  return {
    async getPlayableCatalogSections() {
      return unwrapApiResponse(
        await contractClient.catalogSection.getPlayableCatalogSections({}),
      );
    },
    async getCatalogSections() {
      return unwrapApiResponse(
        await contractClient.admin.catalogSection.getCatalogSections({}),
      );
    },
    async createCatalogSection(section) {
      return unwrapApiResponse(
        await contractClient.admin.catalogSection.createCatalogSection({
          body: section,
        }),
      );
    },
    async renameCatalogSection({ id, section }) {
      return unwrapApiResponse(
        await contractClient.admin.catalogSection.renameCatalogSection({
          params: { id },
          body: section,
        }),
      );
    },
    async moveCatalogSection({ id, move }) {
      return unwrapApiResponse(
        await contractClient.admin.catalogSection.moveCatalogSection({
          params: { id },
          body: move,
        }),
      );
    },
    async deleteCatalogSection(id) {
      unwrapApiResponse(
        await contractClient.admin.catalogSection.deleteCatalogSection({
          params: { id },
          body: {},
        }),
      );
    },
    async addPackToCatalogSection({ id, packId }) {
      return unwrapApiResponse(
        await contractClient.admin.catalogSection.addPackToCatalogSection({
          params: { id, packId },
          body: {},
        }),
      );
    },
    async removePackFromCatalogSection({ id, packId }) {
      return unwrapApiResponse(
        await contractClient.admin.catalogSection.removePackFromCatalogSection({
          params: { id, packId },
          body: {},
        }),
      );
    },
    async movePackInCatalogSection({ id, packId, move }) {
      return unwrapApiResponse(
        await contractClient.admin.catalogSection.movePackInCatalogSection({
          params: { id, packId },
          body: move,
        }),
      );
    },
  };
}
