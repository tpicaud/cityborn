import {
  type CreateGuessObject,
  type CreateWorldLocation,
  type FullGuessObject,
  type GuessObject,
  type GuessObjectId,
  type GuessObjectSearchResult,
  type PatchGuessObject,
  unwrapApiResponse,
  type WorldLocationId,
  type WorldLocationSearchResult,
} from '@cityborn/api';
import { contractClient } from './contract-client';

type GuessObjectRequest = {
  id: GuessObjectId;
  includes: string[];
};

type PatchGuessObjectRequest = {
  id: GuessObjectId;
  updatedFields: PatchGuessObject;
};

type WorldLocationLookup = {
  id: string;
  osmType: string;
};

export async function getGuessObject({
  id,
  includes,
}: GuessObjectRequest): Promise<GuessObject | null> {
  const result = await contractClient.admin.guessObjects.getGuessObject({
    params: { id },
    query: { include: includes.join(',') },
  });
  if (result.status === 404) return null;
  return unwrapApiResponse(result);
}

export async function getFullGuessObject(
  id: GuessObjectId,
): Promise<FullGuessObject | null> {
  const result = await contractClient.admin.guessObjects.getFullGuessObject({
    params: { id },
  });
  if (result.status === 404) return null;
  return unwrapApiResponse(result);
}

export async function saveGuessObject(
  guessObject: CreateGuessObject,
): Promise<GuessObjectId> {
  return unwrapApiResponse(
    await contractClient.admin.guessObjects.createGuessObject({
      body: guessObject,
    }),
  );
}

export async function patchGuessObject({
  id,
  updatedFields,
}: PatchGuessObjectRequest): Promise<GuessObjectId> {
  return unwrapApiResponse(
    await contractClient.admin.guessObjects.updateGuessObject({
      params: { id },
      body: updatedFields,
    }),
  );
}

export async function searchGuessObjectByName(
  query: string,
): Promise<GuessObjectSearchResult[]> {
  return unwrapApiResponse(
    await contractClient.admin.search.searchGuessObject({
      query: { q: query },
    }),
  );
}

export async function searchGuessObjectByExternalId(
  externalId: string,
): Promise<GuessObjectSearchResult | undefined> {
  const searchResults: GuessObjectSearchResult[] = unwrapApiResponse(
    await contractClient.admin.search.searchGuessObject({
      query: { external_id: externalId },
    }),
  );
  return searchResults.at(0);
}

export async function searchWorldLocationByName(
  query: string,
): Promise<WorldLocationSearchResult[]> {
  return unwrapApiResponse(
    await contractClient.admin.search.searchWorldLocation({
      query: { q: query },
    }),
  );
}

export async function searchWorldLocationById({
  id,
  osmType,
}: WorldLocationLookup): Promise<WorldLocationSearchResult | undefined> {
  const searchResults: WorldLocationSearchResult[] = unwrapApiResponse(
    await contractClient.admin.search.searchWorldLocation({
      query: { id, osm_type: osmType },
    }),
  );
  return searchResults.at(0);
}

export async function createWorldLocation(
  worldLocation: CreateWorldLocation,
): Promise<WorldLocationId> {
  return unwrapApiResponse(
    await contractClient.admin.worldLocation.createWorldLocation({
      body: worldLocation,
    }),
  );
}
