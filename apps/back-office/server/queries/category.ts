import { toActionResult } from '@cityborn/api';
import { adminClient } from '@/lib/adminApiClient';

export async function getCategory(id: string) {
  const result = await adminClient.category.getCategory({
    params: { id },
    query: { include: 'guessObjects,world_location_preview' },
  });
  return toActionResult(result);
}
