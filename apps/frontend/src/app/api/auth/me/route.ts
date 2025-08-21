// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { apiFetch } from "../../apiFetch";

export async function GET() {
    try {
        const response = await apiFetch(`/auth/me`, {
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

