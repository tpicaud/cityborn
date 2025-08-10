import { Session } from "@cityborn/types";
import { NextResponse } from "next/server";
import { authFetch } from "../authFetch";

export async function POST(req: Request) {
    const body = await req.json();

    const response = await authFetch(`${process.env.NEXT_PUBLIC_REST_BACKEND_URL}/session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.message || response.statusText;
        throw new Error(`Erreur HTTP ${response.status}: ${message}`);
    }

    const data = await response.json();
    const session: Session = data.session;
    return NextResponse.json(session);
}