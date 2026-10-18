import type {
  GuessObjectSearchResult,
  WorldLocationSearchResult,
} from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';

type SearchContractClient = {
  admin: Pick<ContractClient['admin'], 'search'>;
};

export type OsmWorldLocationReference = {
  osmId: string;
  osmType: string;
};

export interface SearchApi {
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
}

export function createSearchApi(
  contractClient: SearchContractClient,
): SearchApi {
  return {
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
  };
}
