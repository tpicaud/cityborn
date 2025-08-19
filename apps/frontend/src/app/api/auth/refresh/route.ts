import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: Request) {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
        return new Response('Unauthorized', { status: 401 });
    }

    const res = await fetch(`${process.env.REST_BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
        return new Response('Unauthorized', { status: 401 });
    }

    const data = await res.json();

    // Met à jour les cookies access_token (et refresh_token si tu en renvoies un nouveau)
    cookieStore.set({
        name: 'access_token',
        value: data.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 15,
    });

    if (data.refresh_token) {
        cookieStore.set({
            name: 'refresh_token',
            value: data.refresh_token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7,
        });
    }

    return NextResponse.json({ access_token: data.access_token });
}
