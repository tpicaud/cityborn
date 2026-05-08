import { createApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { getBaseUrl } from '../../utils';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const tokenStorage = new WebTokenStorage(await cookies());
  const client = createApiClient(getBaseUrl(), tokenStorage);

  const { sessionId } = await params;
  const result = await client.session.getSession({ params: { id: sessionId } });
  return NextResponse.json(result.body, { status: result.status });
}
