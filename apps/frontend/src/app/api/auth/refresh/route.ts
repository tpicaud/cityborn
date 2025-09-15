import { NextResponse } from 'next/server';
import { getRefreshToken, storeTokensInCookies } from '../utils';
import { apiFetch } from '../../apiFetch';
import { ErrorCode } from '@cityborn/errors';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: Request) {
    try {
        const refresh_token = await getRefreshToken();

        const response = await apiFetch(`/auth/refresh`, {
            requestOptions: {
                method: 'POST',
                headers: {
                    ...req.headers,
                    Cookie: `refresh_token=${refresh_token}`
                }
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        await storeTokensInCookies(data.access_token, data.refresh_token);

        return NextResponse.json(
            { message: "Refreshed successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                code: ErrorCode.UNKNOWN_ERROR,
                message: error.message || "Internal Server Error",
                statusCode: 500
            },
            { status: 500 }
        );
    }
}
