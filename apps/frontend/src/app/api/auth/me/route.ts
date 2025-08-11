// app/api/auth/me/route.ts
import { authFetch } from "../../authFetch";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await authFetch(`${process.env.NEXT_PUBLIC_REST_BACKEND_URL}/auth/me`);

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.message || "Erreur inconnue" },
                { status: data.statusCode || 500 }
            );
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error("Internal error in /api/auth/me :", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

