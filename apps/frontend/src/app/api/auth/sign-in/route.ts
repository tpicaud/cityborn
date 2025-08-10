import { cookies } from 'next/headers';

export async function POST(req: Request) {
    const body = await req.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_REST_BACKEND_URL}/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await res.json();

    cookies().set({
        name: 'access_token',
        value: data.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 15,
    });

    return Response.json({ success: true });
}