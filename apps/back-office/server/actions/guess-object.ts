'use server';

import type { CreateGuessObject } from '@cityborn/api';
import { toApiResult } from '@cityborn/api';
import { adminClient } from '@/lib/adminApiClient';

export async function getGuessObject(id: string, includes?: string[]) {
  const result = await adminClient.guessObjects.getGuessObject({
    params: { id },
    query: { include: includes?.join(',') },
  });
  if (result.status === 404) return null;
  return toApiResult(result);
}

export async function getFullGuessObject(id: string) {
  const result = await adminClient.guessObjects.getFullGuessObject({
    params: { id },
  });
  if (result.status === 404) return null;
  return toApiResult(result);
}

export async function saveGuessObject(createGuessObject: CreateGuessObject) {
  const result = await adminClient.guessObjects.createGuessObject({
    body: createGuessObject,
  });
  return toApiResult(result);
}

export async function patchGuessObject(
  id: string,
  updatedFields: Parameters<
    typeof adminClient.guessObjects.updateGuessObject
  >[0]['body'],
) {
  const result = await adminClient.guessObjects.updateGuessObject({
    params: { id },
    body: updatedFields,
  });
  return toApiResult(result);
}

export async function deleteGuessObject(id: string) {
  const result = await adminClient.guessObjects.deleteGuessObject({
    params: { id },
    body: {},
  });
  return toApiResult(result);
}

export async function searchGuessObjectByName(query: string) {
  const result = await adminClient.search.searchGuessObject({
    query: { q: query },
  });
  return toApiResult(result);
}

export async function searchGuessObjectByExternalId(external_id: string) {
  const result = await adminClient.search.searchGuessObject({
    query: { external_id },
  });
  const apiResult = toApiResult(result);
  if (!apiResult.ok) return apiResult;
  return { ok: true as const, data: apiResult.data[0] };
}

export async function searchWorldLocationByName(query: string) {
  const result = await adminClient.search.searchWorldLocation({
    query: { q: query },
  });
  return toApiResult(result);
}

export async function searchWorldLocationById(id: string, osm_type: string) {
  const result = await adminClient.search.searchWorldLocation({
    query: { id, osm_type },
  });
  const apiResult = toApiResult(result);
  if (!apiResult.ok) return apiResult;
  return { ok: true as const, data: apiResult.data[0] };
}
