import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '../../apiFetch';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const response = await apiFetch(`/auth/verify-email`, {
            requestOptions: {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            },
            forceAuth: false
        });
        console.log(response.status)


        if (!response.ok) {
            const data = await response.json();
            const message = data.message;
            return NextResponse.json({ message, statusCode: response.status }, { status: response.status });
        }

        return NextResponse.json(
            { message: "Email verified successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Internal Server Error", statusCode: 500 },
            { status: 500 }
        );
    }
}
