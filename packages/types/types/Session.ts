import type { SessionMode } from '../enums/SessionMode.js';
import type { SessionStatus } from '../enums/SessionStatus.js';
import type { Game } from './Game.js';
import type { GameConfig } from './GameConfig.js';
import type { Player } from './Player.js';

export interface Session {
  id: string;
  hostID: string;
  mode: SessionMode;
  status: SessionStatus;
  gameConfig: GameConfig;
  players: Player[];

  // Game
  currentGame?: Game;
}
