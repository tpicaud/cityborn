interface PlayerResults {
    results: Result[]
}

interface Result {
    guessObjectId: string,
    distance: number,
    points: number
}

export type { PlayerResults, Result }