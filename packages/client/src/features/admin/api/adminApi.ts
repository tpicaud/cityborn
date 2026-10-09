import type {
  AppContract,
  Category,
  CategoryId,
  CreateCategory,
  CreateGuessObject,
  CreateWorldLocation,
  FullCategory,
  FullGuessObject,
  GuessObject,
  GuessObjectId,
  GuessObjectSearchResult,
  PatchGuessObject,
  UpdateCategory,
  WorldLocationId,
  WorldLocationSearchResult,
} from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ClientInferResponses } from '@ts-rest/core';
import type { ContractClient } from '../../../api/contractClient';

type CategoryUpdate = {
  categoryId: CategoryId;
  category: UpdateCategory;
};

type GuessObjectUpdate = {
  guessObjectId: GuessObjectId;
  guessObject: PatchGuessObject;
};

export type OsmWorldLocationReference = {
  osmId: string;
  osmType: string;
};

export interface AdminApi {
  getCategories(): Promise<Category[]>;
  getFullCategory(categoryId: CategoryId): Promise<FullCategory | null>;
  createCategory(category: CreateCategory): Promise<Category>;
  updateCategory(categoryUpdate: CategoryUpdate): Promise<Category>;
  deleteCategory(categoryId: CategoryId): Promise<void>;
  getGuessObject(guessObjectId: GuessObjectId): Promise<GuessObject | null>;
  getFullGuessObject(
    guessObjectId: GuessObjectId,
  ): Promise<FullGuessObject | null>;
  createGuessObject(guessObject: CreateGuessObject): Promise<GuessObjectId>;
  updateGuessObject(
    guessObjectUpdate: GuessObjectUpdate,
  ): Promise<GuessObjectId>;
  searchGuessObjectsByName(
    searchTerm: string,
  ): Promise<GuessObjectSearchResult[]>;
  findGuessObjectByExternalId(
    externalId: string,
  ): Promise<GuessObjectSearchResult | null>;
  searchWorldLocationsByName(
    searchTerm: string,
  ): Promise<WorldLocationSearchResult[]>;
  findWorldLocationByOsmReference(
    osmWorldLocationReference: OsmWorldLocationReference,
  ): Promise<WorldLocationSearchResult | null>;
  createWorldLocation(
    worldLocation: CreateWorldLocation,
  ): Promise<WorldLocationId>;
}

export function createAdminApi(
  contractClient: Pick<ContractClient, 'admin'>,
): AdminApi {
  return {
    async getCategories() {
      return unwrapApiResponse(
        await contractClient.admin.category.getAllCategories({
          query: { include: 'guessObjects' },
        }),
      );
    },

    async getFullCategory(categoryId) {
      const result: ClientInferResponses<
        AppContract['admin']['category']['getFullCategory']
      > = await contractClient.admin.category.getFullCategory({
        params: { id: categoryId },
      });
      if (result.status === 404) return null;
      return unwrapApiResponse(result);
    },

    async createCategory(category) {
      return unwrapApiResponse(
        await contractClient.admin.category.createCategory({ body: category }),
      );
    },

    async updateCategory({ categoryId, category }) {
      return unwrapApiResponse(
        await contractClient.admin.category.updateCategory({
          params: { id: categoryId },
          body: category,
        }),
      );
    },

    async deleteCategory(categoryId) {
      unwrapApiResponse(
        await contractClient.admin.category.deleteCategory({
          params: { id: categoryId },
          body: {},
        }),
      );
    },

    async getGuessObject(guessObjectId) {
      const result: ClientInferResponses<
        AppContract['admin']['guessObjects']['getGuessObject']
      > = await contractClient.admin.guessObjects.getGuessObject({
        params: { id: guessObjectId },
        query: { include: 'world_location_preview' },
      });
      if (result.status === 404) return null;
      return unwrapApiResponse(result);
    },

    async getFullGuessObject(guessObjectId) {
      const result: ClientInferResponses<
        AppContract['admin']['guessObjects']['getFullGuessObject']
      > = await contractClient.admin.guessObjects.getFullGuessObject({
        params: { id: guessObjectId },
      });
      if (result.status === 404) return null;
      return unwrapApiResponse(result);
    },

    async createGuessObject(guessObject) {
      return unwrapApiResponse(
        await contractClient.admin.guessObjects.createGuessObject({
          body: guessObject,
        }),
      );
    },

    async updateGuessObject({ guessObjectId, guessObject }) {
      return unwrapApiResponse(
        await contractClient.admin.guessObjects.updateGuessObject({
          params: { id: guessObjectId },
          body: guessObject,
        }),
      );
    },

    async searchGuessObjectsByName(searchTerm) {
      return unwrapApiResponse(
        await contractClient.admin.search.searchGuessObject({
          query: { q: searchTerm },
        }),
      );
    },

    async findGuessObjectByExternalId(externalId) {
      const searchResults: GuessObjectSearchResult[] = unwrapApiResponse(
        await contractClient.admin.search.searchGuessObject({
          query: { external_id: externalId },
        }),
      );
      return searchResults.at(0) ?? null;
    },

    async searchWorldLocationsByName(searchTerm) {
      return unwrapApiResponse(
        await contractClient.admin.search.searchWorldLocation({
          query: { q: searchTerm },
        }),
      );
    },

    async findWorldLocationByOsmReference({ osmId, osmType }) {
      const searchResults: WorldLocationSearchResult[] = unwrapApiResponse(
        await contractClient.admin.search.searchWorldLocation({
          query: { id: osmId, osm_type: osmType },
        }),
      );
      return searchResults.at(0) ?? null;
    },

    async createWorldLocation(worldLocation) {
      return unwrapApiResponse(
        await contractClient.admin.worldLocation.createWorldLocation({
          body: worldLocation,
        }),
      );
    },
  };
}
