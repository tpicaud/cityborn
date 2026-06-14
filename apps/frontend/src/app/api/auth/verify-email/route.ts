import { ApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { getBaseUrl, throwApiError } from '../../utils';

export async function POST(req: NextRequest) {
  const tokenStorage = new WebTokenStorage(await cookies());
  const apiClient = new ApiClient(getBaseUrl(), tokenStorage);

  try {
    const body = await req.json();

    await apiClient.verifyEmail(body.verification_token);
    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 },
    );
  } catch (error: unknown) {
    return throwApiError(error);
  }
}
