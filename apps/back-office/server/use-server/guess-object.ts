'use server';

import type { CreateGuessObject, CreateWorldLocation } from '@cityborn/api';
import { toApiResult } from '@cityborn/api';
import { getAdminClient } from '@/lib/adminApiClient';

export async function getGuessObject(id: string, includes?: string[]) {
  const result = await getAdminClient().guessObjects.getGuessObject({
    params: { id },
    query: { include: includes?.join(',') },
  });
  if (result.status === 404) return null;
  return toApiResult(result);
}

export async function getFullGuessObject(id: string) {
  const result = await getAdminClient().guessObjects.getFullGuessObject({
    params: { id },
  });
  if (result.status === 404) return null;
  return toApiResult(result);
}

export async function saveGuessObject(createGuessObject: CreateGuessObject) {
  const result = await getAdminClient().guessObjects.createGuessObject({
    body: createGuessObject,
  });
  return toApiResult(result);
}

export async function patchGuessObject(
  id: string,
  updatedFields: Parameters<
    ReturnType<typeof getAdminClient>['guessObjects']['updateGuessObject']
  >[0]['body'],
) {
  const result = await getAdminClient().guessObjects.updateGuessObject({
    params: { id },
    body: updatedFields,
  });
  return toApiResult(result);
}

export async function searchGuessObjectByName(query: string) {
  const result = await getAdminClient().search.searchGuessObject({
    query: { q: query },
  });
  return toApiResult(result);
}

export async function searchGuessObjectByExternalId(external_id: string) {
  const result = await getAdminClient().search.searchGuessObject({
    query: { external_id },
  });
  const apiResult = toApiResult(result);
  if (!apiResult.ok) return apiResult;
  return { ok: true as const, data: apiResult.data[0] };
}

export async function searchWorldLocationByName(query: string) {
  const result = await getAdminClient().search.searchWorldLocation({
    query: { q: query },
  });
  return toApiResult(result);
}

export async function searchWorldLocationById(id: string, osm_type: string) {
  const result = await getAdminClient().search.searchWorldLocation({
    query: { id, osm_type },
  });
  const apiResult = toApiResult(result);
  if (!apiResult.ok) return apiResult;
  return { ok: true as const, data: apiResult.data[0] };
}

export async function createWorldLocation(worldLocation: CreateWorldLocation) {
  const result = await getAdminClient().worldLocation.createWorldLocation({
    body: worldLocation,
  });
  return toApiResult(result);
}
