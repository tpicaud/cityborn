// app/api/auth/me/route.ts
import { authFetch } from "../../authFetch";
import { NextResponse } from "next/server";

export async function GET() {
    const res = await authFetch(`${process.env.NEXT_PUBLIC_REST_BACKEND_URL}/auth/me`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
