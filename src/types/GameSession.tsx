interface GameSession {
    results: GuessResult[];
}

interface GuessResult {
    star: string
    distance: number;
    points: number;
}

export type { GameSession, GuessResult };