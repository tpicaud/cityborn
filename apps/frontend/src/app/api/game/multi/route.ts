import { NextResponse } from "next/server";
import Game from "@/types/Game";
import GameConfig from "@/types/GameConfig";
import GuessObject from "@/types/GuessObject";
import { OnlinePlayer } from "@/types/Player";
import { redis } from "../../lib/redis";
import { GameMode } from "@/enums/GameMode";
import { createGame, fetchGuessObjects, fetchGuessObjectsFromIds } from "../utils";

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
		const players: OnlinePlayer[] = playersID.map(playerID => ({ id: playerID, connected: false }));
		const newGame: Game = createGame(gameConfig, hostID, gameMode, players, guessObjects2);

		// Store game in redis
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const gameID = searchParams.get("gameID");
		
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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