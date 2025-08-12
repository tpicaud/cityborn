import { NextResponse } from "next/server";

export async function GET({ params }: { params: { gameId: string } }) {
    try {
        const { gameId } = params;
        if (!gameId) {
            return NextResponse.json(
                { message: "Parameter gameId is required", statusCode: 400 },
                { status: 400 }
            );
        }

        const response = await fetch(`${process.env.REST_BACKEND_URL}/game/${gameId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        if (!response.ok) {
            const message = data.message || "Failed to fetch guess objects";
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