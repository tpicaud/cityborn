'use server';

import type { CreateGuessObject, UpdateCategory } from '@cityborn/api';
import { adminClient, throwOnError } from '@/lib/adminApiClient';

export async function getGuessObject(id: string, includes?: string[]) {
  const result = await adminClient.guessObjects.getGuessObject({
    params: { id },
    query: { include: includes?.join(',') },
  });
  if (result.status === 404) return null;
  throwOnError(result);
  if (result.status === 200) return result.body;
  throw new Error('Failed to get guess object');
}

export async function saveCategory(
  id: string,
  updatedCategory: UpdateCategory,
) {
  const result = await adminClient.category.updateCategory({
    params: { id },
    body: updatedCategory,
  });
  throwOnError(result);
  if (result.status === 200) return result.body;
  throw new Error('Failed to save category');
}

export async function deleteCategory(id: string) {
  const result = await adminClient.category.deleteCategory({
    params: { id },
    body: {},
  });
  throwOnError(result);
}

export async function saveGuessObject(
  createGuessObject: CreateGuessObject,
): Promise<string> {
  const result = await adminClient.guessObjects.createGuessObject({
    body: createGuessObject,
  });
  throwOnError(result);
  if (result.status === 201) return result.body;
  throw new Error('Failed to save guess object');
}

export async function patchGuessObject(
  id: string,
  updatedFields: Parameters<
    typeof adminClient.guessObjects.updateGuessObject
  >[0]['body'],
): Promise<string> {
  const result = await adminClient.guessObjects.updateGuessObject({
    params: { id },
    body: updatedFields,
  });
  throwOnError(result);
  if (result.status === 200) return result.body;
  throw new Error('Failed to patch guess object');
}
