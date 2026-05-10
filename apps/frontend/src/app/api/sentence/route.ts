import { createApiClient, type ScoreType } from '@cityborn/api';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { getBaseUrl } from '../utils';

export async function GET(req: NextRequest) {
  const tokenStorage = new WebTokenStorage(await cookies());
  const client = createApiClient(getBaseUrl(), tokenStorage);

  const score_type = (req.nextUrl.searchParams.get('score_type') ??
    '') as ScoreType;
  const result = await client.sentence.getSentence({ query: { score_type } });
  return NextResponse.json(result.body, { status: result.status });
}
