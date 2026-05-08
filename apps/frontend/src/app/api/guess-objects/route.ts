import { createApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { getBaseUrl } from '../utils';

export async function GET(req: NextRequest) {
  const tokenStorage = new WebTokenStorage(await cookies());
  const client = createApiClient(getBaseUrl(), tokenStorage);

  const guessObjectsIds = req.nextUrl.searchParams.get('guessObjectsIds') ?? '';
  const result = await client.guessObjects.getGuessObjects({
    query: { guessObjectsIds },
  });
  return NextResponse.json(result.body, { status: result.status });
}
