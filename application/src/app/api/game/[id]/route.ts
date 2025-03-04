import { NextResponse } from "next/server";
import { connectToDatabase } from "../../utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Connexion à la base de données
    const client = await connectToDatabase();
    const db = client.db(process.env.NEXT_PUBLIC_GAMES_DB);
    const collection = db.collection(process.env.NEXT_PUBLIC_GAMES_COLLECTION!);

    // Recherche du jeu avec le champ "id"
    const game = await collection.findOne({ id: params.id });

    if (!game) {
      return NextResponse.json(
        { message: "Game non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(game, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération du game:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du game." },
      { status: 500 }
    );
  }
}
