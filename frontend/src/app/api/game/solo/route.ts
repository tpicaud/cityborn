import { NextResponse } from "next/server";
import Game from "@/types/Game";
import GameConfig from "@/types/GameConfig";
import { Player } from "@/types/Player";
import { GameMode } from "@/enums/GameMode";
import { createGame, fetchGuessObjects } from "../utils";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { gameConfig, hostID }: { gameConfig: GameConfig, hostID: string } = body;

		if (!gameConfig) {
			return NextResponse.json(
				{ message: "gameConfig est requis." },
				{ status: 400 }
			);
		}

		// Fetch guessObjects
		const guessObjects2 = await fetchGuessObjects(gameConfig);

		// Create game
		const players: Player[] = [{ id: hostID }];
		const newGame: Game = createGame(gameConfig, hostID, GameMode.SOLO, players, guessObjects2);

		return NextResponse.json({ game: newGame }, { status: 201 });

	} catch (error) {
		console.error("Erreur lors de la création de la game:", error);
		return NextResponse.json(
			{ message: "Erreur lors de la création de la game." },
			{ status: 500 }
		);
	}
}