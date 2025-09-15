// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "../../apiFetch";
import { ErrorCode } from "@cityborn/errors";
import { getAccessToken, getRefreshToken } from "../utils";

export async function GET(req: NextRequest) {
    try {
        const access_token = await getAccessToken();
        const refresh_token = await getRefreshToken();

        if (!access_token && !refresh_token) return NextResponse.json({}, { status: 200 });

        const response = await apiFetch(`/auth/me`, {
            requestOptions: {
                method: 'GET',
                headers: req.headers ?? {},
                cache: 'no-store'
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

