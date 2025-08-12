import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const queryString = req.nextUrl.searchParams.toString();

        const response = await fetch(`${process.env.REST_BACKEND_URL}/guess-objects?${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
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