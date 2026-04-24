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

    await apiClient.trackEvent({ ...body });
    return NextResponse.json(
      { message: 'Event successfully sent' },
      { status: 200 },
    );
  } catch (error: any) {
    return throwApiError(error);
  }
}
