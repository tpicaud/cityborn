'use server';

import { ApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
// app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { getBaseUrl, throwApiError } from '../../utils';

export async function GET() {
  const tokenStorage = new WebTokenStorage(await cookies());
  const apiClient = new ApiClient(getBaseUrl(), tokenStorage);

  try {
    const user = await apiClient.getCurrentUser();
    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    return throwApiError(error);
  }
}
