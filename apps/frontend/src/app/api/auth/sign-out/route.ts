import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { WebTokenStorage } from '@/lib/tokenStorage';

export async function POST() {
  const tokenStorage = new WebTokenStorage(await cookies());
  await tokenStorage.clearTokens();
  return NextResponse.json(
    { message: 'Signed out successfully' },
    { status: 200 },
  );
}
