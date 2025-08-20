import { NextResponse } from 'next/server';
import { getRefreshToken, storeTokensInCookies } from '../utils';
import { apiFetch } from '../../apiFetch';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: Request) {
    try {
        const refresh_token = await getRefreshToken();

        const response = await apiFetch(`/auth/refresh`, {
            requestOptions: {
                method: 'POST',
                headers: {
                    Cookie: `refresh_token=${refresh_token}`
                }
            }
        });

        const data = await response.json();

        if (!response.ok) {
            const message = data.message || "Failed to fetch current user";
            return NextResponse.json({ message, statusCode: response.status }, { status: response.status });
        }

        await storeTokensInCookies(data.access_token, data.refresh_token);

        return NextResponse.json(
            { message: "Refreshed successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Internal Server Error", statusCode: 500 },
            { status: 500 }
        );
    }
}
