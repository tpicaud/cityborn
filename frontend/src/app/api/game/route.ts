import { NextResponse } from "next/server";
import { GameStatus } from "@/enums/GameStatus";
import Game from "@/types/Game";
import GameConfig from "@/types/GameConfig";
import GuessObject from "@/types/GuessObject";
import { Categories } from "@/enums/Categories";
import { uniqueNamesGenerator } from "unique-names-generator";
import { connectToDatabase } from "@/utils/connectToDatabase";
import { GameMode } from "@/enums/GameMode";
import { tennis_dictionnary } from "../custom_dictionnary";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameMode, gameConfig } = body;

    if (!gameMode || !gameConfig) {
      return NextResponse.json(
        { message: "gameMode, gameConfig et playerID sont requis." },
        { status: 400 }
      );
    }

    // Fetch guessObjects
    const guessObjects = await fetchGuessObjects(gameConfig);

    switch (gameMode) {

      case GameMode.MULTI:
        const newMultiGame: Game = createMultiGame(gameConfig, guessObjects);
        //await collection.insertOne(newMultiGame);
        return NextResponse.json(newMultiGame, { status: 201 });

      case GameMode.SOLO:
        const newSoloGame: Game = createSoloGame(gameConfig, guessObjects);
        return NextResponse.json(newSoloGame, { status: 201 });
    }

  } catch (error) {
    console.error("Erreur lors de la création de la game:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de la game." },
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

    const pipeline = [];
    if (gameConfig.categories.length > 0 && !gameConfig.categories.includes(Categories.TOUTES)) {
      pipeline.push({ $match: { category: { $in: gameConfig.categories } } });
    }

    pipeline.push({ $sample: { size: gameConfig.nbOfObjects } });

    const randomCelebrities = await collection.aggregate(pipeline).toArray();

    const guessObjects: GuessObject[] = randomCelebrities
      .filter(doc => doc.name && doc.category && doc.description && doc.image)
      .map(doc => ({
        id: doc._id.toString(),
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


function createMultiGame(gameConfig: GameConfig, guessObjects: GuessObject[]): Game {
  // Création de la nouvelle game
  const newGame: Game = {
    id: uniqueNamesGenerator({
      dictionaries: [tennis_dictionnary, tennis_dictionnary],
      separator: '-',
      length: 2
    }),
    lastActivity: Date.now(),
    mode: GameMode.MULTI,
    hostID: '',
    status: GameStatus.IN_LOBBY,
    gameConfig,
    players: [],
    currentRound: undefined,
    guessObjectsIds: guessObjects.map(guessObject => guessObject.id),
    guessObjects: guessObjects,
  };

  return newGame
}

function createSoloGame(gameConfig: GameConfig, guessObjects: GuessObject[]): Game {
  // Création de la nouvelle game
  const newGame: Game = {
    id: uniqueNamesGenerator({
      dictionaries: [tennis_dictionnary, tennis_dictionnary],
      separator: '-',
      length: 2
    }),
    lastActivity: Date.now(),
    mode: GameMode.SOLO,
    hostID: 'guest',
    status: GameStatus.IN_LOBBY,
    gameConfig,
    players: [],
    currentRound: undefined,
    guessObjectsIds: guessObjects.map(guessObject => guessObject.id),
    guessObjects: guessObjects,
  };

  return newGame
}

