import { createApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { getBaseUrl } from '../../utils';

export async function POST(req: NextRequest) {
  const tokenStorage = new WebTokenStorage(await cookies());
  const client = createApiClient(getBaseUrl(), tokenStorage);

  const body = await req.json();
  const result = await client.auth.signUp({ body });

  if (result.status === 201) {
    await tokenStorage.setTokens(
      result.body.access_token,
      result.body.refresh_token,
    );
    return NextResponse.json({ message: 'Signed up successfully' }, { status: 200 });
  }
  return NextResponse.json(result.body, { status: result.status });
}
