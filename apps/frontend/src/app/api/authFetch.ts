import { cookies } from 'next/headers';

export async function authFetch(url: string, options = {}) {
    const cookieStore = cookies();
    let token = cookieStore.get('access_token')?.value;

    // Si pas de token, on refuse direct (ou on peut tenter un refresh)
    if (!token) {
            return new Response(JSON.stringify({ message: 'Unauthorized', statusCode: 401 }), { status: 401, headers: { 'Content-Type': 'application/json' }});
    }

    let res = await fetch(url, {
        ...options,
        headers: {
            ...(options as any).headers,
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (res.status === 401) {
        // Token expiré, on tente le refresh
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
        if (!refreshRes.ok) {
            return new Response(JSON.stringify({ message: 'Unauthorized', statusCode: 401 }), { status: 401, headers: { 'Content-Type': 'application/json' }});
        }
        const refreshData = await refreshRes.json();

        token = refreshData.access_token;

        // Retenter la requête avec nouveau token
        res = await fetch(url, {
            ...options,
            headers: {
                ...(options as any).headers,
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
    }

    return res;
}
