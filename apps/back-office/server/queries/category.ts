import { toApiResult } from '@cityborn/api';
import { adminClient } from '@/lib/adminApiClient';

export async function getCategory(id: string) {
  const result = await adminClient.category.getCategory({
    params: { id },
    query: { include: 'guessObjects,world_location_preview' },
  });
  const action = toApiResult(result);
  if (!action.ok) throw new Error(action.error.message);
  return action.data;
}
