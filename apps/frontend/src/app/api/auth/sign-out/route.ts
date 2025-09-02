import { NextResponse } from 'next/server';
import { expireTokensInCookies } from '../utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: Request) {
    await expireTokensInCookies();
    return NextResponse.json(
        { message: 'Signed out successfully' },
        { status: 200 }
    );
}
