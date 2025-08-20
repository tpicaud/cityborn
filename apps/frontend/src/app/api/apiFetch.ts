import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getRefreshToken, storeTokensInCookies } from '../actions/cookies';

const baseUrl = process.env.REST_BACKEND_URL;

export async function apiFetch(
    endpoint: string,
    {
        requestOptions = {},
        forceAuth = true,
    }: {
        requestOptions?: RequestInit,
        forceAuth?: boolean
    } = {}
): Promise<Response> {
    const options = requestOptions || {};

    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    // if (!token && forceAuth) {
    //     return NextResponse.json({ message: 'Unauthorized', statusCode: 401 }, { status: 401 });
    // }

    // Build headers
    const headers: any = {
        ...(options.headers || {}),
        'Content-Type': 'application/json',
        Accept: 'application/json',
    }

    if (token) headers.Authorization = `Bearer ${token}`;

    let res = await fetch(baseUrl + endpoint, {
        ...options,
        headers
    });

    if (res.status === 401) {
        // try refresh
        await refreshTokens();

        // Retry with new tokens
        res = await fetch(baseUrl + endpoint, {
            ...options,
            headers
        });
    }

    return res;
}

async function refreshTokens() {
    // Token expiré, on tente le refresh
    const refresh_token = await getRefreshToken();
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', headers: { Cookie: `refresh_token=${refresh_token}` } });

    const data = await refreshRes.json();

    if (!refreshRes.ok) {
        return NextResponse.json({ message: data.message, statusCode: 401 }, { status: 401 });
    }

    await storeTokensInCookies(data.access_token, data.refresh_token);
}
