import { NextResponse } from "next/server";
import { GameStatus } from "@/enums/GameStatus";
import Game from "@/types/Game";
import GameConfig from "@/types/GameConfig";
import GuessObject from "@/types/GuessObject";
import { Categories } from "@/enums/Categories";
import { uniqueNamesGenerator } from "unique-names-generator";
import { connectToDatabase } from "@/utils/connectToDatabase";
import { tennis_dictionnary } from "../custom_dictionnary";
import { GamePlayer } from "@/types/Player";
import { redis } from "../lib/redis";
import { GameMode } from "@/enums/GameMode";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { gameConfig, hostID, gameMode, playersID }: { gameConfig: GameConfig, hostID: string, gameMode: GameMode, playersID: string[] } = body;

		if (!gameConfig) {
			return NextResponse.json(
				{ message: "gameConfig est requis." },
				{ status: 400 }
			);
		}

		// Fetch guessObjects
		const guessObjects2 = await fetchGuessObjects(gameConfig);

		// Create game
		const players: GamePlayer[] = playersID.map(playerID => ({ id: playerID, connected: false }));
		const newGame: Game = createGame(gameConfig, hostID, gameMode, players, guessObjects2);

		// Store game in redis
		const { guessObjects, ...lightState } = newGame.state;
		const lightGame = { ...newGame, state: lightState };
		await redis.set(`game:${newGame.id}`, lightGame), { ex: 600 };

		return NextResponse.json({ game: newGame }, { status: 201 });

	} catch (error) {
		console.error("Erreur lors de la création de la game:", error);
		return NextResponse.json(
			{ message: "Erreur lors de la création de la game." },
			{ status: 500 }
		);
	}
}

export async function GET(request: Request, { params }: { params: { gameID: string } }) {
	try {
		const { searchParams } = new URL(request.url);
		const gameID = searchParams.get("gameID");
		
		const lightGame: any = await redis.get(`game:${gameID}`);
		if (!lightGame) throw new Error(`Game ${gameID} introuvable`);

		const guessObjects: GuessObject[] = await fetchGuessObjectsFromIds(lightGame.state.guessObjectsIds);

		const game: Game = { ...lightGame, state: { ...lightGame.state, guessObjects } }

		return NextResponse.json({ game }, { status: 201 });
	} catch (error) {
		console.error("Erreur lors de la récupération de la game:", error);
		return NextResponse.json(
			{ message: "Erreur lors de la récupération de la game." },
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

async function fetchGuessObjectsFromIds(guessObjectsIds: string[]): Promise<GuessObject[]> {
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

function createGame(gameConfig: GameConfig, hostID: string, gameMode: GameMode, players: GamePlayer[], guessObjects: GuessObject[]): Game {
	// Création de la nouvelle game
	const newGame: Game = {
		id: uniqueNamesGenerator({
			dictionaries: [tennis_dictionnary, tennis_dictionnary, tennis_dictionnary],
			separator: '-',
			length: 3
		}),
		hostID: hostID,
		mode: gameMode,
		status: GameStatus.IN_GAME,
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