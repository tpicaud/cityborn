import { NextResponse } from 'next/server';
import { apiFetch } from '../../apiFetch';
import { ErrorCode } from '@cityborn/errors';

export async function POST() {
    try {
        const response = await apiFetch(`/auth/send-verification-email`, {
            requestOptions: {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            },
        });

        if (!response.ok) {
            const data = await response.json();
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(
            { message: "Verification email sent successfully" },
            { status: 200 }
        );
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
