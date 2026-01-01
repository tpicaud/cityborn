export interface PlayerResults {
  results: Result[];
}

export interface Result {
  guessObjectId: string;
  distance: number;
  points: number;
}
