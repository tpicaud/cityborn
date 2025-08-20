import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "../apiFetch";

export async function GET(req: NextRequest) {
    try {
        const queryString = req.nextUrl.searchParams.get('score_type');

        const response = await apiFetch(`/sentence?score_type=${queryString}`, {
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