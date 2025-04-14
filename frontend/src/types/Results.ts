interface GameResults {
    playerResults: PlayerResults[]
}

interface PlayerResults {
    results: Result[]
}

interface Result {
    guessObjectName: string,
    distance: number,
    points: number
}

export type { GameResults, PlayerResults, Result }