import { NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { cookies } from 'next/headers';
import { getBaseUrl, throwApiError } from '../../utils';
import { ApiClient } from '@cityborn/api';

export async function POST() {
  const tokenStorage = new WebTokenStorage(await cookies());
  const apiClient = new ApiClient(getBaseUrl(), tokenStorage);

  try {
    await apiClient.sendVerificationEmail();
    return NextResponse.json(
      { message: 'Verification email sent successfully' },
      { status: 200 },
    );
  } catch (error: any) {
    return throwApiError(error);
  }
}
