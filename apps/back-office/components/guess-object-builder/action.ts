'use server';

import { adminClient, throwOnError } from '@/lib/adminApiClient';

export async function searchGuessObjectByName(query: string) {
  const result = await adminClient.search.searchGuessObject({
    query: { q: query },
  });
  throwOnError(result);
  if (result.status === 200) return result.body;
  throw new Error('Failed to search guess objects');
}

export async function searchGuessObjectByExternalId(external_id: string) {
  const result = await adminClient.search.searchGuessObject({
    query: { external_id },
  });
  throwOnError(result);
  if (result.status === 200) return result.body[0];
  throw new Error('Failed to search guess object by external id');
}

export async function searchWorldLocationByName(query: string) {
  const result = await adminClient.search.searchWorldLocation({
    query: { q: query },
  });
  throwOnError(result);
  if (result.status === 200) return result.body;
  throw new Error('Failed to search world locations');
}

export async function searchWorldLocationById(id: string, osm_type: string) {
  const result = await adminClient.search.searchWorldLocation({
    query: { id, osm_type },
  });
  throwOnError(result);
  if (result.status === 200) return result.body[0];
  throw new Error('Failed to search world location');
}

export async function deleteGuessObject(id: string): Promise<void> {
  const result = await adminClient.guessObjects.deleteGuessObject({
    params: { id },
    body: {},
  });
  throwOnError(result);
}
