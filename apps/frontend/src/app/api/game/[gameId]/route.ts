import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "../../apiFetch";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
    try {
        const gameId = (await params).gameId;
        if (!gameId) {
            return NextResponse.json(
                { message: "Parameter gameId is required", statusCode: 400 },
                { status: 400 }
            );
        }

        const response = await apiFetch(`/game/${gameId}`, {
            requestOptions: {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            },
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