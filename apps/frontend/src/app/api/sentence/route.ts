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
    const scoreType = searchParams.get('score_type');

    const sentence = await apiClient.getEndSentence(scoreType || '');
    return NextResponse.json(sentence, { status: 200 });
  } catch (error: any) {
    return throwApiError(error);
  }
}
