import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "../../apiFetch";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const response = await apiFetch(`/session/create-game`, {
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