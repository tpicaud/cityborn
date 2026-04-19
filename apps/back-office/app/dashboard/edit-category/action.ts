'use server';

import { Category } from '@cityborn/types';
import { apiFetch } from '../../../lib/apiFetch';

export async function getCategory(id: string): Promise<Category> {
  const response = await apiFetch(
    `${process.env.BACKEND_URL}/admin/category/${id}?include=guessObjects,world_location_preview`,
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
  return data as Category;
}
