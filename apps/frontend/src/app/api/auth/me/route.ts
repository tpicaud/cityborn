'use server';

import { createApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { getBaseUrl } from '../../utils';

export async function GET() {
  const tokenStorage = new WebTokenStorage(await cookies());

  const access = await tokenStorage.getAccessToken();
  const refresh = await tokenStorage.getRefreshToken();
  if (!access && !refresh) return NextResponse.json(null, { status: 200 });

  const client = createApiClient(getBaseUrl(), tokenStorage);
  const result = await client.auth.me();
  return NextResponse.json(result.body, { status: result.status });
}
