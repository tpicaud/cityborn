import { Categories } from "@/enums/Categories";
import { GameMode } from "@/enums/GameMode";
import { GameStatus } from "@/enums/GameStatus";
import Game from "@/types/Game";
import GameConfig from "@/types/GameConfig";
import GuessObject from "@/types/GuessObject";
import { connectToDatabase } from "@/utils/connectToDatabase";
import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator";

export async function fetchGuessObjects(gameConfig: GameConfig): Promise<GuessObject[]> {
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

export function createMultiGame(gameConfig: GameConfig, guessObjects: GuessObject[]): Game {
    // Création de la nouvelle game
    const newGame: Game = {
      id: uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        separator: '-',
        length: 3
      }),
      mode: GameMode.MULTI,
      hostID: '',
      status: GameStatus.LOBBY,
      gameConfig,
      players: [],
      currentRound: undefined,
      guessObjects: guessObjects,
    };
  
    return newGame
  }