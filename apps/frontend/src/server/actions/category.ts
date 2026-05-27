'use server';

import type { Category } from '@cityborn/api';
import { type ActionResult, toActionResult } from '@/lib/actionUtils';
import { getServerClient } from '@/lib/serverClient';

export async function fetchCategories(): Promise<ActionResult<Category[]>> {
  const client = await getServerClient();
  const result = await client.category.getCategories({ query: {} });
  return toActionResult(result);
}
