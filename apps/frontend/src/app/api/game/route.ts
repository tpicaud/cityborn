import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "../authFetch";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const response = await authFetch(`${process.env.REST_BACKEND_URL}/game`, {
            requestOptions: {
                method: 'POST',
                body: JSON.stringify(body),
            },
        });

        const data = await response.json();

        if (!response.ok) {
            const message = data.message || "Failed to fetch current user";
            return NextResponse.json({ message, statusCode: response.status }, { status: response.status });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Internal Server Error", statusCode: 500 },
            { status: 500 }
        );
    }
}