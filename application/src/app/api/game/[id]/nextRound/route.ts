import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/connectToDatabase";
import Game from "@/types/Game";
import Round from "@/types/Round";
import { Result } from "@/types/Results"
import { RoundStatus } from "@/enums/RoundStatus";
import { GameStatus } from "@/enums/GameStatus";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const gameID = params.id;
        const { playerID } = await request.json();

        if (!gameID) {
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

        // Vérifier que le host
        if (game.hostID !== playerID) {
            return NextResponse.json({ message: "Accès interdit." }, { status: 403 });
        }

        // Vérification que la partie a encore des rounds à jouer
        if (!game.guessObjects || game.guessObjects.length === 0) {
            return NextResponse.json({ message: "Aucun objet à deviner disponible." }, { status: 400 });
        }

        // Trouver l'index du currentRound
        const currentIndex = game.currentRound
            ? game.guessObjects.findIndex(obj => obj.name === game.currentRound?.guessObject.name)
            : -1;

        // Vérifier que l'objet est dans la liste
        if (currentIndex === -1) {
            return NextResponse.json({ message: "L'objet à deviner ne fais pas partie de la liste de la partie" }, { status: 400 });
        }


        // Récupérer les résultats des joueurs et les enregistrer dans la base de données
        if (game.currentRound?.playersGuesses) {
            await collection.updateOne(
                { id: game.id },
                {
                    $set: {
                        players: game.players.map(player => {

                            const newResult: Result = {
                                guessObject: game.currentRound!.guessObject,
                                distance: game.currentRound!.playersGuesses![player.id].distance,
                                points: game.currentRound!.playersGuesses![player.id].points
                            }

                            return {
                                ...player,
                                results: [
                                    ...player.results,
                                    newResult
                                ].filter(result => result !== null) // Filtrer les valeurs nulles
                            }
                        })
                    }
                }
            );
        }


        // Vérifier s'il y a un round suivant
        if (currentIndex + 1 >= game.guessObjects.length) {
            // Mise à jour du round actuel dans la base de données
            await collection.updateOne(
                { id: gameID },
                {
                    $set: {
                        status: GameStatus.RESULTS,
                        currentRound: undefined
                    }
                }
            );
            return NextResponse.json({ message: "Plus de rounds, la partie passe aux résultats" }, { status: 200 });
        }

        // Définir le prochain round
        const nextRound: Round = {
            status: RoundStatus.GUESSING, // Assurez-vous que cette valeur correspond bien à RoundStatus
            guessObject: game.guessObjects[currentIndex + 1],
            playersGuesses: {},
        };

        // Mise à jour du round actuel dans la base de données
        await collection.updateOne(
            { id: gameID },
            { $set: { currentRound: nextRound } }
        );

        return NextResponse.json({ message: "Nouveau round démarré." }, { status: 200 });
    } catch (error) {
        console.error("Erreur lors du changement de round:", error);
        return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
    }
}
