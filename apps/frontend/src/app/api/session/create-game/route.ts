import { NextRequest, NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { ApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { getBaseUrl, throwApiError } from '../../utils';

export async function POST(req: NextRequest) {
  const tokenStorage = new WebTokenStorage(await cookies());
  const apiClient = new ApiClient(getBaseUrl(), tokenStorage);

  const body = await req.json();

  try {
    const game = await apiClient.createSoloGame(body.session);
    return NextResponse.json(game, { status: 200 });
  } catch (error: any) {
    return throwApiError(error);
  }
}
