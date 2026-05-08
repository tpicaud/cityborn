'use server';

import { adminClient, throwOnError } from '../../../lib/adminApiClient';

export async function getCategory(id: string) {
  const result = await adminClient.category.getCategory({
    params: { id },
    query: { include: 'guessObjects,world_location_preview' },
  });
  throwOnError(result);
  if (result.status === 200) return result.body;
  throw new Error('Failed to get category');
}
