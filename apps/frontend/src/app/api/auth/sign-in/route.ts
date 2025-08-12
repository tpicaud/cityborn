import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();

		const response = await fetch(`${process.env.REST_BACKEND_URL}/auth/sign-in`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});

		const data = await response.json();

		if (!response.ok) {
			const message = data.message || "Failed to fetch current user";
			return NextResponse.json({ message, statusCode: response.status }, { status: response.status });
		}

		const cookieStore = await cookies();
		cookieStore.set({
			name: 'access_token',
			value: data.access_token,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 60 * 15,
			path: '/',
		});

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
