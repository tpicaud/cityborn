import { NextResponse } from "next/server";
import swaggerDefinition from "@/lib/swagger";

export function GET() {
    return NextResponse.json(swaggerDefinition);
}
