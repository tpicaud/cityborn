import GuessObject from "./GuessObject"

interface GameResults {
    playerResults: PlayerResults[]
}

interface PlayerResults {
    results: Result[]
}

interface Result {
    guessObject: GuessObject,
    distance: number,
    points: number
}

export type { GameResults, PlayerResults, Result }