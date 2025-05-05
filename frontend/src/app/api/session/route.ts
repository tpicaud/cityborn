import { NextResponse } from "next/server";

import { Categories } from "@/enums/Categories";
import { uniqueNamesGenerator } from "unique-names-generator";
import { GameMode } from "@/enums/GameMode";
import { tennis_dictionnary } from "../custom_dictionnary";
import { Session } from "@/types/Session";
import { SessionStatus } from "@/enums/SessionStatus";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameMode } = body;

    if (!gameMode ) {
      return NextResponse.json(
        { message: "gameMode est requis." },
        { status: 400 }
      );
    }


    switch (gameMode) {

      case GameMode.MULTI:
        const newMultiSession: Session = createSession(GameMode.MULTI)
        return NextResponse.json(newMultiSession, { status: 201 });

      case GameMode.SOLO:
        const newSoloSession: Session = createSession(GameMode.SOLO);
        return NextResponse.json(newSoloSession, { status: 201 });
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

function createSession(gameMode: GameMode): Session {
  const newSession: Session = {
    id: uniqueNamesGenerator({
      dictionaries: [tennis_dictionnary, tennis_dictionnary],
      separator: '-',
      length: 2
    }),
    lastActivity: Date.now(),
    mode: gameMode,
    hostID: gameMode === GameMode.SOLO ? 'guest' : '',
    status: SessionStatus.IN_LOBBY,
    gameConfig: {
      categories: [Categories.TOUTES],
      timer: 20,
      nbOfObjects: 3
    },
    players: gameMode === GameMode.SOLO ? [{id: 'guest', connected: true}] : [],
  };

  return newSession
}

