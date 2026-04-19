import type { GameStatus } from '../enums/GameStatus.js';
import type { SessionMode } from '../enums/SessionMode.js';
import type { GameConfig } from './GameConfig.js';
import type { GuessObject } from './GuessObject.js';
import type { Player } from './Player.js';
import type { PlayerResults } from './Results.js';
import type { Round } from './Round.js';

export interface Game {
  id: string;
  config: GameConfig;
  status: GameStatus;
  state: GameState;
}

export interface GameState {
  guessObjectsIds: string[];
  results: Record<string, PlayerResults>;

  // Round
  currentRound?: Round;

  // Heavy params
  guessObjects?: GuessObject[];
}

export interface GameRecord {
  id: string;
  mode: SessionMode;
  gameConfig: GameConfig;
  players: Player[];
  guessObjectsIds: string[];
  results: Record<string, PlayerResults>;
  createdAt: string;
}

export type CreateGameRecord = Omit<GameRecord, 'id' | 'createdAt'>;
