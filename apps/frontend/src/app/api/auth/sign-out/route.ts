import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: Request) {

    const response = NextResponse.json({ success: true, message: 'Signed out successfully' });
    response.cookies.set({
        name: 'access_token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
    });

    return response;
}
