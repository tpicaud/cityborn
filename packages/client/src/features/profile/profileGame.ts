import type { GameRecord, PlayerId, PlayerResults, User } from '@cityborn/api';
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
  localUser: Pick<User, 'id' | 'username'>,
): ProfileGame[] {
  const emptyResults: PlayerResults = { results: [] };

  return gameRecords.map((gameRecord) => {
    const localPlayer = gameRecord.players.find(
      ({ id, username }) =>
        id === localUser.id || username === localUser.username,
    );
    const localPlayerID: PlayerId = localPlayer?.username ?? localUser.username;

    return {
      gameRecord,
      localPlayerPoints: calculateTotalPoints(
        gameRecord.results[localPlayerID] ?? emptyResults,
      ),
      playerScores: gameRecord.players.map(({ username }) => ({
        playerID: username,
        points: calculateTotalPoints(gameRecord.results[username]),
      })),
    };
  });
}
