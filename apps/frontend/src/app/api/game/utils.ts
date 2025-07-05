import { Categories } from "@cityborn/types";
import { GameMode } from "@cityborn/types";
import { GameStatus } from "@cityborn/types";
import { Game } from "@cityborn/types";
import { GameConfig } from "@cityborn/types";
import { GuessObject } from "@cityborn/types";
import { Player } from "@cityborn/types";
import { connectToDatabase } from "@/utils/connectToDatabase";
import { ObjectId } from "mongodb";
import { uniqueNamesGenerator } from "unique-names-generator";
import { tennis_dictionnary } from "../custom_dictionnary";

export async function fetchGuessObjects(gameConfig: GameConfig): Promise<GuessObject[]> {
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

export async function fetchGuessObjectsFromIds(guessObjectsIds: string[]): Promise<GuessObject[]> {
	try {
		const client = await connectToDatabase();
		const db = client.db(process.env.NEXT_PUBLIC_CELEBRITIES_DB);
		const collection = db.collection(process.env.NEXT_PUBLIC_CELEBRITIES_COLLECTION!);

		// Convertir les IDs en ObjectId
		const objectIds = guessObjectsIds.map(id => new ObjectId(id));

		const documents = await collection
			.find({ _id: { $in: objectIds } })
			.toArray();

		const guessObjects: GuessObject[] = documents
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
		console.error("Erreur lors de la récupération des célébrités par ID :", error);
		throw new Error("Erreur lors de la récupération des célébrités par ID.");
	}
}

export function createGame(gameConfig: GameConfig, hostID: string, gameMode: GameMode, players: Player[], guessObjects: GuessObject[]): Game {
	// Création de la nouvelle game
	const newGame: Game = {
		id: uniqueNamesGenerator({
			dictionaries: [tennis_dictionnary, tennis_dictionnary, tennis_dictionnary],
			separator: '-',
			length: 3
		}),
		hostID: hostID,
		mode: gameMode,
		status: GameStatus.STARTING,
		gameConfig,
		players: players,
		state: {
			guessObjectsIds: guessObjects.map(guessObject => guessObject.id),
			currentRound: undefined,
			results: {},
			guessObjects: guessObjects,
		}
	};

	return newGame
}