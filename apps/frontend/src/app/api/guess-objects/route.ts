import { NextRequest, NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { ApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { getBaseUrl, throwApiError } from '../utils';

export async function GET(req: NextRequest) {
  const tokenStorage = new WebTokenStorage(await cookies());
  const apiClient = new ApiClient(getBaseUrl(), tokenStorage);

  try {
    const searchParams = req.nextUrl.searchParams;
    const guessObjectsIdsParam = searchParams.get('guessObjectsIds');

    const guessObjectsIds: string[] = guessObjectsIdsParam
      ? guessObjectsIdsParam.split(',')
      : [];

    const guessObjects = await apiClient.fetchGuessObjects(guessObjectsIds);
    return NextResponse.json(guessObjects, { status: 200 });
  } catch (error: any) {
    return throwApiError(error);
  }
}
