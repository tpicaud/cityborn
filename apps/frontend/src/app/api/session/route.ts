import { NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { ApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { getBaseUrl, throwApiError } from '../utils';

export async function POST(req: Request) {
  const tokenStorage = new WebTokenStorage(await cookies());
  const apiClient = new ApiClient(getBaseUrl(), tokenStorage);

  try {
    const body = await req.json();

    const session = await apiClient.createSession(body.mode);
    return NextResponse.json(session, { status: 200 });
  } catch (error: any) {
    return throwApiError(error);
  }
}
