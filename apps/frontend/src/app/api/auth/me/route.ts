// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { apiFetch } from "../../apiFetch";
import { ErrorCode } from "@cityborn/errors";
import { getAccessToken } from "../utils";

export async function GET() {
    try {
        const access_token = getAccessToken()
        if (!access_token) return NextResponse.json({}, { status: 200 });


        const response = await apiFetch(`/auth/me`, {
            requestOptions: {
                method: 'GET'
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, { status: 200 });
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

