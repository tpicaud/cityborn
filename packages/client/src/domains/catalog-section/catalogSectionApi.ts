import type {
  CatalogSection,
  CatalogSectionId,
  MoveCatalogSection,
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
  createCatalogSection(section: SaveCatalogSection): Promise<CatalogSection>;
  renameCatalogSection(data: {
    id: CatalogSectionId;
    section: SaveCatalogSection;
  }): Promise<CatalogSection>;
  moveCatalogSection(data: {
    id: CatalogSectionId;
    move: MoveCatalogSection;
  }): Promise<CatalogSection[]>;
  deleteCatalogSection(id: CatalogSectionId): Promise<void>;
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
  };
}
