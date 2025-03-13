import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/connectToDatabase";
import Game from "@/types/Game";
import { GameStatus } from "@/enums/GameStatus";
import { sendMessage } from "../../../../../server";

export async function PUT(request: Request) {
    try {
        const { gameID, playerID } = await request.json();
        if (!gameID || !playerID) {
            return NextResponse.json({ message: "Données invalides." }, { status: 400 });
        }

        const client = await connectToDatabase();
        const db = client.db(process.env.NEXT_PUBLIC_GAMES_DB);
        const collection = db.collection(process.env.NEXT_PUBLIC_GAMES_COLLECTION!);

        // Récupération du jeu dans la base de données
        const game = (await collection.findOne({ id: gameID })) as Game | null;

        if (!game) {
            return NextResponse.json({ message: "Partie introuvable." }, { status: 404 });
        }

        // Check si l'id du joueur est déjà dans la partie
        const playerExists = game.players.some(player => player.id === playerID);

        if (playerExists) {
            return NextResponse.json({ message: "Le joueur est déjà dans la partie." }, { status: 400 });
        }

        // Check si la partie est déjà lancé
        if (game.status != GameStatus.LOBBY) {
            return NextResponse.json({ message: "La partie est déjà lancée." }, { status: 400 });
        }

        // Créer un nouveau joueur
        const newPlayer: any = { id: playerID, results: [], connected: true };

        // Si la liste des players est vide, le nouveau joueur devient host
        let updateFields: any = { $push: { players: newPlayer } };

        if (game.players.length === 0) {
            updateFields.$set = { hostID: playerID }; // Mettre à jour le hostID si players est vide
        }

        await collection.updateOne(
            { id: gameID },
            updateFields
        );

        // Récupérer l'objet mis à jour
        const updatedGame = (await collection.findOne({ id: gameID })) as Game | null;

        if (!updatedGame) {
            return NextResponse.json({ message: "Erreur lors de la récupération de la partie mise à jour." }, { status: 500 });
        }

        sendMessage(JSON.stringify({
            type: 'gameUpdate',
            data: updatedGame
        }))

        return NextResponse.json({ message: "Le joueur a été ajouté avec succès." }, { status: 200 });
    } catch (error) {
        console.error("Erreur lors de l'ajout du joueur:", error);
        return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
    }
}
