// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { authFetch } from "../../authFetch";

export async function GET() {
    try {
        const response = await authFetch(`${process.env.REST_BACKEND_URL}/auth/me`, {
            requestOptions: {
                method: 'GET'
            },
        });

        const data = await response.json();

        if (!response.ok) {
            const message = data.message || "Failed to fetch current user";
            return NextResponse.json({ message, statusCode: response.status }, { status: response.status });
        }

        // If null, return null user
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Internal Server Error", statusCode: 500 },
            { status: 500 }
        );
    }
}

