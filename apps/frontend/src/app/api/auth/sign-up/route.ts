import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '../../apiFetch';
import { storeTokensInCookies } from '../utils';

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
			const message = data.message || "Failed to fetch current user";
			return NextResponse.json({ message, statusCode: response.status }, { status: response.status });
		}

		await storeTokensInCookies(data.access_token, data.refresh_token);

		return NextResponse.json(
			{ message: "Signed in successfully" },
			{ status: 200 }
		);
	} catch (error: any) {
		return NextResponse.json(
			{ message: error.message || "Internal Server Error", statusCode: 500 },
			{ status: 500 }
		);
	}
}
