import { GameRecordSchema, SessionMode } from '@cityborn/api';
import { GameMode } from '@prisma/client';
import { buildPrismaGameRecord } from '../../test/support/fixtures';
import { GameMapper } from './game.mapper';

describe('GameMapper.toGameRecord', () => {
  it('maps and validates persisted game records', () => {
    const records = GameMapper.toGameRecord([
      buildPrismaGameRecord({
        mode: GameMode.multi,
        players: [{ username: 'host', isGuest: false }],
        guessObjectsIds: ['guess-1'],
        results: { host: { results: [] } },
      }),
    ]);

    expect(records).toHaveLength(1);
    expect(() => GameRecordSchema.parse(records[0])).not.toThrow();
    expect(records[0]).toMatchObject({
      mode: SessionMode.MULTI,
      createdAt: '2026-01-01',
    });
  });

  it('rejects invalid persisted player data', () => {
    expect(() =>
      GameMapper.toGameRecord([
        buildPrismaGameRecord({ players: [{ username: 'host' }] }),
      ]),
    ).toThrow();
  });
});
