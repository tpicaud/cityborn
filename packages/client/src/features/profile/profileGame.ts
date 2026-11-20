import {
  type GameConfigPack,
  type GameRecord,
  type GameRecordId,
  type Player,
  type PlayerId,
  type PlayerResults,
  SessionMode,
  type User,
} from '@cityborn/api';
import { calculateTotalPoints, formatDate } from '@cityborn/core';

export type ProfileGame = {
  id: GameRecordId;
  title: string;
  playedOn: string;
  points: number;
};

const sessionModeLabels: Record<SessionMode, string> = {
  [SessionMode.SOLO]: 'Solo',
  [SessionMode.MULTI]: 'Multi',
};

const quickPlayLabel: string = 'Partie rapide';

function playedPacksLabel([
  firstPack,
  ...otherPacks
]: GameConfigPack[]): string {
  return firstPack && otherPacks.length === 0 ? firstPack.name : quickPlayLabel;
}

export function createProfileGames(
  gameRecords: GameRecord[],
  localUser: Pick<User, 'id' | 'username'>,
): ProfileGame[] {
  const emptyResults: PlayerResults = { results: [] };

  return gameRecords.map((gameRecord: GameRecord): ProfileGame => {
    const localPlayer: Player | undefined = gameRecord.players.find(
      ({ id, username }) =>
        id === localUser.id || username === localUser.username,
    );
    const localPlayerID: PlayerId = localPlayer?.username ?? localUser.username;

    return {
      id: gameRecord.id,
      title: `${sessionModeLabels[gameRecord.mode]} - ${playedPacksLabel(gameRecord.gameConfig.packs)}`,
      playedOn: formatDate(gameRecord.createdAt),
      points: calculateTotalPoints(
        gameRecord.results[localPlayerID] ?? emptyResults,
      ),
    };
  });
}
