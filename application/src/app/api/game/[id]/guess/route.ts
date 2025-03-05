import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/connectToDatabase";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { playerID, guess } = await request.json();

        if (!playerID || !guess) {
            return NextResponse.json(
                { message: "Données invalides." },
                { status: 400 }
            );
        }

        // Connexion à la base de données
        const client = await connectToDatabase();
        const db = client.db(process.env.NEXT_PUBLIC_GAMES_DB);
        const collection = db.collection(process.env.NEXT_PUBLIC_GAMES_COLLECTION!);

        // Récupérer la game actuelle
        const game = await collection.findOne({ id: params.id });

        if (!game) {
            return NextResponse.json(
                { message: "Game non trouvée." },
                { status: 404 }
            );
        }

        // Vérifier si playerID existe dans la liste des joueurs (game.players)
        const playerExists = game.players.some((player: { id: string }) => player.id === playerID);

        if (!playerExists) {
            return NextResponse.json(
                { message: "Joueur non trouvé dans cette partie." },
                { status: 403 }
            );
        }

        // Vérifier si un round est actif
        if (!game.round) {
            return NextResponse.json(
                { message: "Aucun round en cours." },
                { status: 400 }
            );
        }

        // Mettre à jour le guess du joueur dans currentRound.playersGuesses
        await collection.updateOne(
            { id: params.id },
            { $set: { [`currentRound.playersGuesses.${playerID}`]: guess } }
        );

        return NextResponse.json(
            { message: "Guess ajouté avec succès." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Erreur lors de l'ajout du guess:", error);
        return NextResponse.json(
            { message: "Erreur serveur." },
            { status: 500 }
        );
    }
}
