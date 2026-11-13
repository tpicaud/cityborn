import {
  type CatalogSection,
  type CatalogSectionId,
  type CreateCatalogSection,
  type MoveCatalogSection,
  type PackId,
  type RenameCatalogSection,
  unwrapApiResponse,
} from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';

type CatalogSectionContractClient = Pick<ContractClient, 'catalogSection'> & {
  admin: Pick<ContractClient['admin'], 'catalogSection'>;
};
export interface CatalogSectionApi {
  getPublishedSections(): Promise<CatalogSection[]>;
  getSections(): Promise<CatalogSection[]>;
  createSection(section: CreateCatalogSection): Promise<CatalogSection>;
  renameSection(data: {
    id: CatalogSectionId;
    section: RenameCatalogSection;
  }): Promise<CatalogSection>;
  moveSection(data: {
    id: CatalogSectionId;
    move: MoveCatalogSection;
  }): Promise<CatalogSection[]>;
  deleteSection(id: CatalogSectionId): Promise<void>;
  addPack(data: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<CatalogSection>;
  removePack(data: {
    id: CatalogSectionId;
    packId: PackId;
  }): Promise<CatalogSection>;
  movePack(data: {
    id: CatalogSectionId;
    packId: PackId;
    move: MoveCatalogSection;
  }): Promise<CatalogSection>;
}
export function createCatalogSectionApi(
  client: CatalogSectionContractClient,
): CatalogSectionApi {
  return {
    async getPublishedSections() {
      return unwrapApiResponse(
        await client.catalogSection.getPublishedSections({}),
      );
    },
    async getSections() {
      return unwrapApiResponse(
        await client.admin.catalogSection.getSections({}),
      );
    },
    async createSection(section) {
      return unwrapApiResponse(
        await client.admin.catalogSection.createSection({ body: section }),
      );
    },
    async renameSection({ id, section }) {
      return unwrapApiResponse(
        await client.admin.catalogSection.renameSection({
          params: { id },
          body: section,
        }),
      );
    },
    async moveSection({ id, move }) {
      return unwrapApiResponse(
        await client.admin.catalogSection.moveSection({
          params: { id },
          body: move,
        }),
      );
    },
    async deleteSection(id) {
      unwrapApiResponse(
        await client.admin.catalogSection.deleteSection({
          params: { id },
          body: {},
        }),
      );
    },
    async addPack(params) {
      return unwrapApiResponse(
        await client.admin.catalogSection.addPack({ params, body: {} }),
      );
    },
    async removePack(params) {
      return unwrapApiResponse(
        await client.admin.catalogSection.removePack({ params, body: {} }),
      );
    },
    async movePack({ id, packId, move }) {
      return unwrapApiResponse(
        await client.admin.catalogSection.movePack({
          params: { id, packId },
          body: move,
        }),
      );
    },
  };
}
