export enum ScoreType {
  GOOD = 'GOOD',
  AVERAGE = 'AVERAGE',
  BAD = 'BAD',
}

export interface Sentence {
  id: string;
  message: string;
  score_type: ScoreType;
}
