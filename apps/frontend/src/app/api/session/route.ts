import { createApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { getBaseUrl } from '../utils';

export async function POST(req: Request) {
  const tokenStorage = new WebTokenStorage(await cookies());
  const client = createApiClient(getBaseUrl(), tokenStorage);

  const body = await req.json();
  const result = await client.session.createSession({ body: { mode: body.mode } });
  return NextResponse.json(result.body, { status: result.status });
}
