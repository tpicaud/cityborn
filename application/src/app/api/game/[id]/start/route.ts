import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/connectToDatabase";
import { GameStatus } from "@/enums/GameStatus";
import Round from "@/types/Round";
import { RoundStatus } from "@/enums/RoundStatus";
import Game from "@/types/Game";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const gameID = params.id;

        if (!gameID) {
            return NextResponse.json({ message: "Données invalides." }, { status: 400 });
        }

        const client = await connectToDatabase();
        const db = client.db(process.env.NEXT_PUBLIC_GAMES_DB);
        const collection = db.collection(process.env.NEXT_PUBLIC_GAMES_COLLECTION!);

        // Récupération du jeu dans la base de données
        const game: Game | null = (await collection.findOne({ id: gameID })) as Game | null;

        // Check si la partie existe
        if (!game) {
            return NextResponse.json({ message: "Partie introuvable." }, { status: 404 });
        }

        // Check si la partie est démarrable
        if (game.status !== GameStatus.LOBBY) {
            return NextResponse.json({ message: "La partie n'est plus joignable" }, { status: 400 });
        }

        // Vérifier s'il y a des objets à deviner
        if (!game.guessObjects || game.guessObjects.length === 0) {
            return NextResponse.json({ message: "Aucun objet à deviner disponible." }, { status: 400 });
        }

        // Sélection du premier objet à deviner
        const firstObject = game.guessObjects[0];

        // Création du premier round
        const firstRound: Round = {
            status: RoundStatus.GUESSING,
            guessObject: firstObject,
            playersGuesses: {},
        };

        // Mise à jour du jeu en base de données avec le premier round
        await collection.updateOne(
            { id: gameID },
            {
                $set: {
                    status: GameStatus.IN_PROGRESS,
                    currentRound: firstRound,
                },
            }
        );

        return NextResponse.json({ message: "La partie a démarré." }, { status: 200 });
    } catch (error) {
        console.error("Erreur lors du démarrage de la partie:", error);
        return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
    }
}
