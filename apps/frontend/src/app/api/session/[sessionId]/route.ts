import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "../../apiFetch";
import { ErrorCode } from "@cityborn/errors";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
    try {
        const sessionId = (await params).sessionId;

        const response = await apiFetch(`/session/${sessionId}`, {
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
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, { status: response.status });
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