'use server';

// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, throwApiError } from '../../utils';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { ApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const tokenStorage = new WebTokenStorage(await cookies());
  const apiClient = new ApiClient(getBaseUrl(), tokenStorage);

  try {
    const user = await apiClient.getCurrentUser();
    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    return throwApiError(error);
  }
}
