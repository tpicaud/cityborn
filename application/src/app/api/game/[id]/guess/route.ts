import { NextResponse } from "next/server";
import { connectToDatabase } from "../../utils";

export async function PUT(request: Request) {
    try {
        const { gameID, playerID, guess } = await request.json();
        if (!gameID || !playerID || !guess) {
            return NextResponse.json({ message: "Données invalides." }, { status: 400 });
        }

        const client = await connectToDatabase();
        const db = client.db(process.env.NEXT_PUBLIC_GAMES_DB);
        const collection = db.collection(process.env.NEXT_PUBLIC_GAMES_COLLECTION!);

        await collection.updateOne(
            { id: gameID },
            { $set: { [`currentRound.playersGuesses.${playerID}`]: guess } }
        );

        return NextResponse.json({ message: "Guess ajouté." }, { status: 200 });
    } catch (error) {
        console.error("Erreur lors de l'ajout du guess:", error);
        return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
    }
}
