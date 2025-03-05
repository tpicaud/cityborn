import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/connectToDatabase";

export async function PUT(request: Request) {
    try {
        const { gameID, playerID } = await request.json();
        if (!gameID || !playerID) {
            return NextResponse.json({ message: "Données invalides." }, { status: 400 });
        }

        const client = await connectToDatabase();
        const db = client.db(process.env.NEXT_PUBLIC_GAMES_DB);
        const collection = db.collection(process.env.NEXT_PUBLIC_GAMES_COLLECTION!);

        const newPlayer: any = { id: playerID, results: [], connected: true };

        await collection.updateOne(
            { id: gameID },
            { $push: { players: newPlayer } }
        );

        return NextResponse.json({ message: "Joueur ajouté avec succès." }, { status: 200 });
    } catch (error) {
        console.error("Erreur lors de l'ajout du joueur:", error);
        return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
    }
}
