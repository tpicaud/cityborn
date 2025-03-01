import { NextResponse } from "next/server";
import { connectToDatabase } from "../../utils";
import { RoundStatus } from "@/enums/RoundStatus";

export async function PUT(request: Request) {
    try {
        const { gameID, nextRound } = await request.json();
        if (!gameID || !nextRound) {
            return NextResponse.json({ message: "Données invalides." }, { status: 400 });
        }

        const client = await connectToDatabase();
        const db = client.db(process.env.NEXT_PUBLIC_GAMES_DB);
        const collection = db.collection(process.env.NEXT_PUBLIC_GAMES_COLLECTION!);

        await collection.updateOne(
            { id: gameID },
            { $set: { currentRound: { status: RoundStatus.GUESSING, ...nextRound } } }
        );

        return NextResponse.json({ message: "Nouveau round démarré." }, { status: 200 });
    } catch (error) {
        console.error("Erreur lors du changement de round:", error);
        return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
    }
}
