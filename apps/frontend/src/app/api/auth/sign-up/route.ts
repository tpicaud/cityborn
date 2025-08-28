import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '../../apiFetch';
import { storeTokensInCookies } from '../utils';
import { ErrorCode } from '@cityborn/errors';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();

		const response = await apiFetch(`/auth/sign-up`, {
			requestOptions: {
				method: 'POST',
				body: JSON.stringify(body)
			},
			forceAuth: false
		});

		const data = await response.json();

		if (!response.ok) {
			return NextResponse.json(data, { status: response.status });
		}

		await storeTokensInCookies(data.access_token, data.refresh_token);

		return NextResponse.json(
			{ message: "Signed in successfully" },
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
