import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "../../apiFetch";
import { ErrorCode } from "@cityborn/errors";

export async function GET(req: NextRequest) {
    try {
        const response = await apiFetch(`/user/game-records`, {
            requestOptions: {
                method: 'GET',
                headers: req.headers ?? {},
            }
        })

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

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const response = await apiFetch(`/user/game-records`, {
            requestOptions: {
                method: 'POST',
                headers: req.headers ?? {},
                body: JSON.stringify(body),
            }
        })


        if (!response.ok) {
            const data = await response.json();
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json({ message: 'success' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            {
                code: ErrorCode.UNKNOWN_ERROR,
                message: error.message || "Internal Server Error",
                statusCode: 500
            },
            { status: 500 }
        );
    }
}