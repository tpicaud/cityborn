import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function authFetch(
    url: string,
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
    let token = cookieStore.get('access_token')?.value;

    // Si pas de token, on refuse direct (ou on peut tenter un refresh)
    if (!token && forceAuth) {
        return NextResponse.json({ message: 'Unauthorized', statusCode: 401 }, { status: 401 });
    }

    // Build headers
    const headers: any = {
        ...(options.headers || {}),
        'Content-Type': 'application/json',
        Accept: 'application/json',
    }

    if (forceAuth) headers.Authorization = `Bearer ${token}`;

    let res = await fetch(url, {
        ...options,
        headers
    });

    // if (res.status === 401) {
    //     // Token expiré, on tente le refresh
    //     const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
    //     if (!refreshRes.ok) {
    //         return NextResponse.json({ message: 'Unauthorized', statusCode: 401 }, { status: 401 });
    //     }
    //     const refreshData = await refreshRes.json();

    //     token = refreshData.access_token;

    //     // Retenter la requête avec nouveau token
    //     res = await fetch(url, {
    //         ...options,
    //         headers: {
    //             ...(options as any).headers,
    //             Accept: 'application/json',
    //             Authorization: `Bearer ${token}`,
    //         },
    //     });
    // }

    return res;
}
