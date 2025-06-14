import { NextResponse } from "next/server";
import { redis } from "../../lib/redis";
import { Session } from "@cityborn/types";

export async function GET(request: Request, { params }: { params: { sessionID: string } }) {
    try {
        const sessionID = params.sessionID;

        if (!sessionID) {
            return NextResponse.json(
                { message: "gameMode est requis." },
                { status: 400 }
            );
        }

        const session: Session | null = await redis.get(`session:${sessionID}`);

        if (!session) {
            return NextResponse.json(
                { message: `Session ${sessionID} non trouvée` },
                { status: 404 }
            );
        }

        return NextResponse.json(session);
    } catch (error) {
        return NextResponse.json(
            { message: `Erreur lors de la récupération de la session: ${error}` },
            { status: 500 }
        );
    }
}

