import { ApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';
import { getBaseUrl, throwApiError } from '../utils';

export async function GET() {
  const tokenStorage = new WebTokenStorage(await cookies());
  const apiClient = new ApiClient(getBaseUrl(), tokenStorage);

  try {
    const categories = await apiClient.fetchCategories();
    return NextResponse.json(categories, { status: 200 });
  } catch (error: any) {
    return throwApiError(error);
  }
}
