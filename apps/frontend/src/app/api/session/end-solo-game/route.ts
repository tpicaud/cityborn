import { ApiClient } from '@cityborn/api';
import type { Session } from '@cityborn/types';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { getBaseUrl, throwApiError } from '../../utils';

export async function POST(req: NextRequest) {
  const tokenStorage = new WebTokenStorage(await cookies());
  const apiClient = new ApiClient(getBaseUrl(), tokenStorage);

  const body = await req.json();

  try {
    console.log(body);
    await apiClient.endSoloGame(body as Session);
    return NextResponse.json(
      { message: 'Game successfully ended' },
      { status: 200 },
    );
  } catch (error: any) {
    return throwApiError(error);
  }
}
