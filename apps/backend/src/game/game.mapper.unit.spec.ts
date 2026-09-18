import type { GameRecord } from '@cityborn/api';
import { GameRecordSchema, SessionMode } from '@cityborn/api';
import { GameMode, type GameRecord as PrismaGameRecord } from '@prisma/client';
import { GameMapper } from '../game-record/mappers/game.mapper';

describe('GameMapper.toGameRecord', () => {
  it('maps and validates persisted game records', () => {
    const prismaGameRecord: PrismaGameRecord = {
      id: '00000000-0000-4000-8000-000000000040',
      mode: 'solo',
      gameConfig: { categories: [], timer: 25, nbOfObjects: 6 },
      players: [],
      guessObjectsIds: [],
      results: {},
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const input: PrismaGameRecord[] = [
      {
        ...prismaGameRecord,
        mode: GameMode.multi,
        players: [{ username: 'host', isGuest: false }],
        guessObjectsIds: ['guess-1'],
        results: { host: { results: [] } },
      },
    ];

    const records: GameRecord[] = GameMapper.toGameRecord(input);

    expect(records).toHaveLength(1);
    expect(() => GameRecordSchema.parse(records[0])).not.toThrow();
    expect(records[0]).toMatchObject({
      mode: SessionMode.MULTI,
      createdAt: '2026-01-01',
    });
  });

  it('rejects invalid persisted player data', () => {
    const prismaGameRecord: PrismaGameRecord = {
      id: '00000000-0000-4000-8000-000000000040',
      mode: 'solo',
      gameConfig: { categories: [], timer: 25, nbOfObjects: 6 },
      players: [],
      guessObjectsIds: [],
      results: {},
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const input: PrismaGameRecord[] = [
      { ...prismaGameRecord, players: [{ username: 'host' }] },
    ];

    expect(() => GameMapper.toGameRecord(input)).toThrow();
  });
});
