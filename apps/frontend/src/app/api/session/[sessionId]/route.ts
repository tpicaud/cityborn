import { NextResponse } from "next/server";

export async function GET({ params }: { params: { sessionId: string } }) {
    try {
        const { sessionId } = params;
        if (!sessionId) {
            return NextResponse.json(
                { message: "Parameter sessionId is required", statusCode: 400 },
                { status: 400 }
            );
        }

        const response = await fetch(`${process.env.REST_BACKEND_URL}/session/${sessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
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