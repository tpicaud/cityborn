'use server';

import type {
  CreateGuessObject,
  GuessObject,
  UpdateCategory,
} from '@cityborn/types';
import { apiFetch } from '@/lib/apiFetch';

export async function getGuessObject(id: string, includes?: string[]) {
  const query =
    includes && includes.length > 0 ? `?include=${includes.join(',')}` : '';

  const response = await apiFetch(
    `${process.env.BACKEND_URL}/admin/guess-objects/${id}${query}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 404) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get guess object');
  }

  return data as GuessObject;
}

export async function saveCategory(
  id: string,
  updatedCategory: UpdateCategory,
) {
  const response = await apiFetch(
    `${process.env.BACKEND_URL}/admin/category/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedCategory),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to save category');
  }

  return data as GuessObject;
}

export async function deleteCategory(id: string) {
  const response = await apiFetch(
    `${process.env.BACKEND_URL}/admin/category/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete category');
  }
}

export async function saveGuessObject(
  createGuessObject: CreateGuessObject,
): Promise<string> {
  const response = await apiFetch(
    `${process.env.BACKEND_URL}/admin/guess-objects`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createGuessObject),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to save guess object');
  }

  return data.id;
}

export async function patchGuessObject(
  id: string,
  updatedFields: Partial<GuessObject>,
): Promise<string> {
  const response = await apiFetch(
    `${process.env.BACKEND_URL}/admin/guess-objects/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedFields),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to patch guess object');
  }

  return data.id;
}
