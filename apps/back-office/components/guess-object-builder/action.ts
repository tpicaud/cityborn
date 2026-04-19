'use server';

import { apiFetch } from '@/lib/apiFetch';
import { GuessObjectCandidate, WorldLocation } from '@cityborn/types';

export async function searchGuessObjectByName(
  query: string,
): Promise<GuessObjectCandidate[]> {
  const response = await apiFetch(
    `${process.env.BACKEND_URL}/admin/search/guess-object?q=${encodeURIComponent(query)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to search guess objects');
  }

  return (data.results as GuessObjectCandidate[]) ?? [];
}

export async function searchGuessObjectByExternalId(
  external_id: string,
): Promise<GuessObjectCandidate> {
  const response = await apiFetch(
    `${process.env.BACKEND_URL}/admin/search/guess-object?external_id=${external_id}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to search guess objects');
  }

  return (data.results as GuessObjectCandidate) ?? {};
}

export async function searchWorldLocationByName(
  query: string,
): Promise<WorldLocation[]> {
  const response = await apiFetch(
    `${process.env.BACKEND_URL}/admin/search/world-location?q=${encodeURIComponent(query)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to search world locations');
  }

  return (data.results as WorldLocation[]) ?? [];
}

export async function searchWorldLocationById(
  id: string,
  osm_type: string,
): Promise<WorldLocation> {
  const response = await apiFetch(
    `${process.env.BACKEND_URL}/admin/search/world-location?id=${id}&osm_type=${osm_type}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to search world location');
  }

  return (data.results as WorldLocation) ?? {};
}

export async function deleteGuessObject(id: string): Promise<void> {
  const response = await apiFetch(
    `${process.env.BACKEND_URL}/admin/guess-objects/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete guess object');
  }
}
