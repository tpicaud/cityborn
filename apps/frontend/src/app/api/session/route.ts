import { NextResponse } from "next/server";
import { apiFetch } from "../apiFetch";
import { ErrorCode } from "@cityborn/errors";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const response = await apiFetch(`/session`, {
            requestOptions: {
                method: 'POST',
                headers: req.headers ?? {},
                body: JSON.stringify(body),
            },
        });
        console.log(response.headers);

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