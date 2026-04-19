import { NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { ApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { getBaseUrl, throwApiError } from '../../utils';

export async function POST() {
  const tokenStorage = new WebTokenStorage(await cookies());
  const apiClient = new ApiClient(getBaseUrl(), tokenStorage);

  try {
    await apiClient.signOut();
    return NextResponse.json(
      { message: 'Signed out successfully' },
      { status: 200 },
    );
  } catch (error: any) {
    return throwApiError(error);
  }
}
