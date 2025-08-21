import { NextResponse } from 'next/server';
import { expireTokensInCookies } from '../utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: Request) {
    await expireTokensInCookies();
    return NextResponse.json({ success: true, message: 'Signed out successfully' });
}
