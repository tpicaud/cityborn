import { createEvent } from '@cityborn/types';
import { getAccessToken, getRefreshToken, storeTokensInCookies } from './auth/utils';

const baseUrl = process.env.REST_BACKEND_URL;

export async function apiFetch(
    endpoint: string,
    {
        requestOptions = {},
        noCookieStore = false
    }: {
        requestOptions?: RequestInit,
        noCookieStore?: boolean
    } = {}
): Promise<Response> {
    const access_token = await getAccessToken();

    let headers: Record<string, string> = {};
    if (requestOptions.headers instanceof Headers) {
        headers = Object.fromEntries(requestOptions.headers.entries());
    } else if (requestOptions.headers) {
        headers = { ...requestOptions.headers } as Record<string, string>;
    }

    // Ajouter le Bearer token
    if (access_token) {
        headers['Authorization'] = `Bearer ${access_token}`;
    }

    // Fusionner headers et options
    const options: RequestInit = {
        ...requestOptions,
        headers
    };

    let res = await fetch(baseUrl + endpoint, options);

    if (res.status === 401) {
        // Send event
        if (!access_token) await sendFirstSignInEvent(headers);

        // try refresh
        const tokens = await refreshTokens();
        if (!tokens) return res;

        // Retry with new tokens
        const { refreshed_access_token, refreshed_refresh_token } = tokens;
        res = await fetch(baseUrl + endpoint, {
            ...options,
            headers: {
                ...headers,
                Authorization: `Bearer ${refreshed_access_token}`,
            }
        });

        if (res.ok && !noCookieStore) await storeTokensInCookies(refreshed_access_token, refreshed_refresh_token);
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

async function sendFirstSignInEvent(headers: Record<string, string> = {}) {
    if (!headers['x-visitor-id']) return;
    try {
        const event = createEvent({
            name: 'user_new_connection',
            visitorId: headers['x-visitor-id'],
            properties: {}
        });

        const response = await fetch(`${baseUrl}/event/track`, {
            method: 'POST',
            headers,
            body: JSON.stringify(event)
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }
    } catch (error) {
        console.error('Error sending first sign-in event:', error);
    }
}