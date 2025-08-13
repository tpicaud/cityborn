import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "../../authFetch";

export async function GET(req: NextRequest, { params }: { params: { gameId: string } }) {
    try {
        const gameId = (await params).gameId;
        if (!gameId) {
            return NextResponse.json(
                { message: "Parameter gameId is required", statusCode: 400 },
                { status: 400 }
            );
        }

        const response = await authFetch(`${process.env.REST_BACKEND_URL}/game/${gameId}`, {
            requestOptions: {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
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