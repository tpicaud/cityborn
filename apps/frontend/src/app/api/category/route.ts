import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "../apiFetch";
import { ErrorCode } from "@cityborn/errors";

export async function GET(req: NextRequest) {
    try {

        const response = await apiFetch(`/category`, {
            requestOptions: {
                method: 'GET',
                headers: req.headers ?? {},
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