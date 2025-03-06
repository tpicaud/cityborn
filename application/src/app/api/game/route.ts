import { NextResponse } from "next/server";
import { GameStatus } from "@/enums/GameStatus";
import Game from "@/types/Game";
import GameConfig from "@/types/GameConfig";
import GuessObject from "@/types/GuessObject";
import { Categories } from "@/enums/Categories";
import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator";
import { connectToDatabase } from "@/utils/connectToDatabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("id");

    if (!gameId) {
      return NextResponse.json(
        { message: "L'identifiant de la game est requis." },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    const client = await connectToDatabase();
    const db = client.db(process.env.NEXT_PUBLIC_GAMES_DB);
    const collection = db.collection(process.env.NEXT_PUBLIC_GAMES_COLLECTION!);

    // Rechercher la game par son id
    const game = await collection.findOne({ id: gameId });

    if (!game) {
      return NextResponse.json(
        { message: "Aucune game trouvée avec cet identifiant." },
        { status: 404 }
      );
    }

    return NextResponse.json(game, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération de la game:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération de la game." },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameMode, gameConfig } = body;

    if (!gameMode || !gameConfig) {
      return NextResponse.json(
        { message: "gameMode et gameConfig sont requis." },
        { status: 400 }
      );
    }

    // Fetch guessObjects
    const guessObjects = await fetchGuessObjects(gameConfig);

    // Connexion à la base de données
    const client = await connectToDatabase();
    const db = client.db(process.env.NEXT_PUBLIC_GAMES_DB);
    const collection = db.collection(process.env.NEXT_PUBLIC_GAMES_COLLECTION!);

    // Création de la nouvelle game
    const newGame: Game = {
      id: uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        separator: '-',
        length: 3
      }),
      mode: gameMode,
      hostID: '',
      status: GameStatus.LOBBY,
      gameConfig,
      players: [],
      currentRound: undefined,
      guessObjects: guessObjects,
    };

    // Insérer la nouvelle game dans la base de données
    await collection.insertOne(newGame);

    return NextResponse.json(newGame.id, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la game:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de la game." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("id");

    if (!gameId) {
      return NextResponse.json(
        { message: "L'identifiant de la game est requis." },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    const client = await connectToDatabase();
    const db = client.db(process.env.NEXT_PUBLIC_GAMES_DB);
    const collection = db.collection(process.env.NEXT_PUBLIC_GAMES_COLLECTION!);

    console.log(gameId);

    // Suppression de la game
    const result = await collection.deleteOne({ id: gameId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Aucune game trouvée avec cet identifiant." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: `Game ${gameId} supprimée avec succès.` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la game:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression de la game." },
      { status: 500 }
    );
  }
}


// Auxiliary functions

async function fetchGuessObjects(gameConfig: GameConfig): Promise<GuessObject[]> {
  try {
    const client = await connectToDatabase();
    const db = client.db(process.env.NEXT_PUBLIC_CELEBRITIES_DB);
    const collection = db.collection(process.env.NEXT_PUBLIC_CELEBRITIES_COLLECTION!);

    const pipeline: any[] = [];
    if (gameConfig.categories.length > 0 && !gameConfig.categories.includes(Categories.TOUTES)) {
      pipeline.push({ $match: { category: { $in: gameConfig.categories } } });
    }

    pipeline.push({ $sample: { size: gameConfig.nbOfObjects } });

    const randomCelebrities = await collection.aggregate(pipeline).toArray();

    const guessObjects: GuessObject[] = randomCelebrities
      .filter(doc => doc.name && doc.category && doc.description && doc.image)
      .map(doc => ({
        name: doc.name,
        category: doc.category,
        description: doc.description,
        short_description: doc.short_description,
        image: doc.image,
        answer: {
          place_name: doc.answer.place_name,
          coordinates: doc.answer.coordinates,
        },
      }));

    return guessObjects;
  } catch (error) {
    console.error("Erreur lors de la récupération des célébrités :", error);
    throw new Error("Erreur lors de la récupération des célébrités.");
  }
}
