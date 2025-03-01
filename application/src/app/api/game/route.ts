import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { GameStatus } from "@/enums/GameStatus";
import Game from "@/types/Game";
import GameConfig from "@/types/GameConfig";
import GuessObject from "@/types/GuessObject";
import { Categories } from "@/enums/Categories";
import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator";
import { connectToDatabase } from "../utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hostID, gameMode, gameConfig } = body;

    if (!hostID || !gameMode || !gameConfig) {
      return NextResponse.json(
        { message: "hostID, gameMode et gameConfig sont requis." },
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
      hostID,
      status: GameStatus.LOBBY,
      gameConfig,
      players: [{
        id: hostID,
        results: [],
        connected: true
      }],
      guessObjects: guessObjects,
      currentRound: undefined,
    };

    // Insérer la nouvelle game dans la base de données
    await collection.insertOne(newGame);

    return NextResponse.json(newGame, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la game:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de la game." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { gameID, update } = body;

    if (!gameID || !update) {
      return NextResponse.json(
        { message: "gameID et update sont requis." },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    const client = await connectToDatabase();
    const db = client.db(process.env.NEXT_PUBLIC_GAMES_DB);
    const collection = db.collection(process.env.NEXT_PUBLIC_GAMES_COLLECTION!);

    // Vérifier si la game existe
    const existingGame = await collection.findOne({ id: gameID });
    if (!existingGame) {
      return NextResponse.json(
        { message: "Game non trouvée." },
        { status: 404 }
      );
    }

    // Mise à jour de la game
    await collection.updateOne(
      { id: gameID },
      { $set: update }
    );

    // Récupérer la game mise à jour
    const updatedGame = await collection.findOne({ id: gameID });

    return NextResponse.json(updatedGame, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la game:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour de la game." },
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
