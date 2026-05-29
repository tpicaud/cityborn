'use server';

import type { CreateGuessObject } from '@cityborn/api';
import { toActionResult } from '@cityborn/api';
import { adminClient } from '@/lib/adminApiClient';

export async function getGuessObject(id: string, includes?: string[]) {
  const result = await adminClient.guessObjects.getGuessObject({
    params: { id },
    query: { include: includes?.join(',') },
  });
  if (result.status === 404) return null;
  return toActionResult(result);
}

export async function saveGuessObject(createGuessObject: CreateGuessObject) {
  const result = await adminClient.guessObjects.createGuessObject({
    body: createGuessObject,
  });
  return toActionResult(result);
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
  return toActionResult(result);
}

export async function deleteGuessObject(id: string) {
  const result = await adminClient.guessObjects.deleteGuessObject({
    params: { id },
    body: {},
  });
  return toActionResult(result);
}

export async function searchGuessObjectByName(query: string) {
  const result = await adminClient.search.searchGuessObject({
    query: { q: query },
  });
  return toActionResult(result);
}

export async function searchGuessObjectByExternalId(external_id: string) {
  const result = await adminClient.search.searchGuessObject({
    query: { external_id },
  });
  const actionResult = toActionResult(result);
  if (!actionResult.ok) return actionResult;
  return { ok: true as const, data: actionResult.data[0] };
}

export async function searchWorldLocationByName(query: string) {
  const result = await adminClient.search.searchWorldLocation({
    query: { q: query },
  });
  return toActionResult(result);
}

export async function searchWorldLocationById(id: string, osm_type: string) {
  const result = await adminClient.search.searchWorldLocation({
    query: { id, osm_type },
  });
  const actionResult = toActionResult(result);
  if (!actionResult.ok) return actionResult;
  return { ok: true as const, data: actionResult.data[0] };
}
