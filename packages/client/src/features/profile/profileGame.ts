import type { GameRecord, PlayerId } from '@cityborn/api';
import { calculateTotalPoints } from '@cityborn/core';

export interface ProfilePlayerScore {
  playerID: PlayerId;
  points: number;
}

export interface ProfileGame {
  gameRecord: GameRecord;
  localPlayerPoints: number;
  playerScores: ProfilePlayerScore[];
}

export function createProfileGames(
  gameRecords: GameRecord[],
  localPlayerID: PlayerId,
): ProfileGame[] {
  return gameRecords.map((gameRecord) => ({
    gameRecord,
    localPlayerPoints: calculateTotalPoints(gameRecord.results[localPlayerID]),
    playerScores: gameRecord.players.map(({ username }) => ({
      playerID: username,
      points: calculateTotalPoints(gameRecord.results[username]),
    })),
  }));
}
