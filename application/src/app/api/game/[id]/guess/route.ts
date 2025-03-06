import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/connectToDatabase";
import Game from "@/types/Game";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { playerID, guess } = await request.json();
        const gameID = params.id

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

        // Récupération du jeu dans la base de données
        const game: Game | null = (await collection.findOne({ id: gameID })) as Game | null;

        // Check si la partie existe
        if (!game) {
            return NextResponse.json({ message: "Partie introuvable." }, { status: 404 });
        }

        // Vérifier si playerID existe dans la liste des joueurs (game.players)
        const playerExists = game.players.some((player: { id: string }) => player.id === playerID);
        if (!playerExists) {
            return NextResponse.json({ message: "Joueur non trouvé dans cette partie." }, { status: 403 });
        }

        // Vérifier si un round est actif
        if (!game.currentRound) {
            return NextResponse.json({ message: "Aucun round en cours." }, { status: 400 });
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
