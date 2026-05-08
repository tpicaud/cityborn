import { createApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { getBaseUrl } from '../utils';

export async function GET() {
  const tokenStorage = new WebTokenStorage(await cookies());
  const client = createApiClient(getBaseUrl(), tokenStorage);

  const result = await client.category.getCategories({ query: {} });
  return NextResponse.json(result.body, { status: result.status });
}
