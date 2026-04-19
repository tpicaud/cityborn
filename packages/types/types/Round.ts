import type { RoundStatus } from '../enums/RoundStatus.js';
import type { Guess } from './Guess.js';

export interface Round {
  status: RoundStatus;
  guessObjectId: string;
  playersGuesses?: Record<string, Guess>;
}
