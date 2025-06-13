import { NextResponse } from "next/server";
import { customAlphabet } from 'nanoid';
import { Categories } from "@/enums/Categories";
import { GameMode } from "@/enums/GameMode";
import { Session } from "@cityborn/types";
import { SessionStatus } from "@/enums/SessionStatus";
import { redis } from "../lib/redis";

const generateID = customAlphabet('0123456789', 6); // 6 chiffres uniquement

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { gameMode }: { gameMode: GameMode } = body;

		if (!gameMode) {
			return NextResponse.json(
				{ message: "gameMode est requis." },
				{ status: 400 }
			);
		}

		// Create session
		const session: Session = await createSession(gameMode);

		// Store in redis
		await redis.set(`session:${session.id}`, JSON.stringify(session), { ex: 600 })

		return NextResponse.json({ session: session }, { status: 201 });
	} catch (error) {
		console.error("Erreur lors de la création de la game:", error);
		return NextResponse.json(
			{ message: "Erreur lors de la création de la game." },
			{ status: 500 }
		);
	}
}

// Auxiliary functions

async function createSession(gameMode: GameMode): Promise<Session> {

	const sessionID: string = await generateUniqueSessionID();

	const newSession: Session = {
		id: sessionID,
		hostID: gameMode === GameMode.SOLO ? 'guest' : '',
		mode: gameMode,
		status: SessionStatus.IN_LOBBY,
		gameConfig: {
			categories: [Categories.TOUTES],
			timer: 20,
			nbOfObjects: 6
		},
		players: gameMode === GameMode.SOLO ? [{ id: 'guest' }] : [],
	};

	return newSession
}


async function generateUniqueSessionID(): Promise<string> {
	let sessionID: string;
	let exists: string | null;

	do {
		sessionID = generateID();
		exists = await redis.get(`session:${sessionID}`);
	} while (exists !== null);

	return sessionID;
}