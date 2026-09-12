import type { GameRecord } from '@cityborn/api';
import { calculateTotalPoints } from '@cityborn/core';
import { isoToLocalDate } from '../infrastructure/date';

export interface GameRecordViewModel {
  id: string;
  mode: string;
  playedAt: string | null;
  totalPoints: number;
  playerUsernames: string[];
  scores: { username: string; totalPoints: number }[];
}

export function toGameRecordViewModel(
  record: GameRecord,
  username: string,
): GameRecordViewModel {
  const playerResults = record.results[username];

  return {
    id: record.id,
    mode: record.mode,
    playedAt: isoToLocalDate(record.createdAt),
    totalPoints: playerResults ? calculateTotalPoints(playerResults) : 0,
    playerUsernames: record.players.map((player) => player.username),
    scores: Object.entries(record.results).map(([player, results]) => ({
      username: player,
      totalPoints: calculateTotalPoints(results),
    })),
  };
}

export function toGameRecordViewModels(
  records: GameRecord[],
  username: string,
): GameRecordViewModel[] {
  return records.map((record) => toGameRecordViewModel(record, username));
}
