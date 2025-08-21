import { NextRequest, NextResponse } from 'next/server';
import { storeTokensInCookies } from '../utils';
import { apiFetch } from '../../apiFetch';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();

		const response = await apiFetch(`/auth/sign-in`, {
			requestOptions: {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			},
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
