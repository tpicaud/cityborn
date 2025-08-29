import { getAccessToken, getRefreshToken, getTokensCookiesHeaders, storeTokensInCookies } from './auth/utils';

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

    const access_token = await getAccessToken();

    // Build headers
    const headers: any = {
        ...(options.headers || {}),
        'Content-Type': 'application/json',
        Accept: 'application/json',
    }

    if (access_token) headers.Authorization = `Bearer ${access_token}`;

    let res = await fetch(baseUrl + endpoint, {
        ...options,
        headers
    });

    if (res.status === 401) {
        // try refresh
        const tokens = await refreshTokens();

        if (!tokens) return res;

        // Retry with new tokens
        const { refreshed_access_token, refreshed_refresh_token } = tokens;
        res = await fetch(baseUrl + endpoint, {
            ...options,
            headers: {
                ...headers,
                Authorization: `Bearer ${refreshed_access_token}`
            }
        });

        if (res.ok) await storeTokensInCookies(refreshed_access_token, refreshed_refresh_token);
    }

    return res;
}

async function refreshTokens() {

    const refresh_token = await getRefreshToken();

    const response = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', headers: { Cookie: `refresh_token=${refresh_token}` } });

    const data = await response.json();

    if (!response.ok) {
        return;
    }

    return {
        refreshed_access_token: data.access_token,
        refreshed_refresh_token: data.refresh_token
    };
}