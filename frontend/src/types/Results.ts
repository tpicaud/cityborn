interface GameResults {
    playerResults: PlayerResults[]
}

interface PlayerResults {
    results: Result[]
}

interface Result {
    guessObjectId: string,
    distance: number,
    points: number
}

export type { GameResults, PlayerResults, Result }