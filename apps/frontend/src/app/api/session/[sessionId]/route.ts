import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "../../authFetch";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
    try {
        const sessionId = (await params).sessionId;
        if (!sessionId) {
            return NextResponse.json(
                { message: "Parameter sessionId is required", statusCode: 400 },
                { status: 400 }
            );
        }

        const response = await authFetch(`${process.env.REST_BACKEND_URL}/session/${sessionId}`, {
            requestOptions: {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
            forceAuth: false
        });

        const data = await response.json();

        if (!response.ok) {
            const message = data.message || "Failed to fetch session";
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