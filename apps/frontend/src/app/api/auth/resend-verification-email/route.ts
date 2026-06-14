import { ApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { getBaseUrl, throwApiError } from '../../utils';

export async function POST() {
  const tokenStorage = new WebTokenStorage(await cookies());
  const apiClient = new ApiClient(getBaseUrl(), tokenStorage);

  try {
    await apiClient.resendVerificationEmail();
    return NextResponse.json(
      { message: 'Verification email sent successfully' },
      { status: 200 },
    );
  } catch (error: unknown) {
    return throwApiError(error);
  }
}
