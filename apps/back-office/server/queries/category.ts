import { throwOnError } from '@cityborn/api';
import { adminClient } from '@/lib/adminApiClient';

export async function getCategories() {
  const result = await adminClient.category.listCategories({
    query: { include: 'guessObjects' },
  });
  throwOnError(result);
  return result.body;
}

export async function getCategory(id: string) {
  const result = await adminClient.category.getCategory({
    params: { id },
    query: { include: 'guessObjects,world_location_preview' },
  });
  throwOnError(result);
  return result.body;
}
