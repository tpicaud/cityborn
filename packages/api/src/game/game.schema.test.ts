import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { z } from 'zod';
import { buildPack } from '../pack/pack.builder';
import type { Pack } from '../pack/pack.schema';
import {
  applyGameConfigChanges,
  type GameConfig,
  GameConfigSchema,
} from './game.schema';

const monuments: Pack = buildPack({
  id: '00000000-0000-4000-8000-000000000011',
  name: 'Monuments',
});
const capitals: Pack = buildPack({
  id: '00000000-0000-4000-8000-000000000012',
  name: 'Capitales',
});

describe('GameConfigSchema', () => {
  it('emits the packs under both keys when only packs is sent', () => {
    const gameConfig: GameConfig = GameConfigSchema.parse({
      packs: [monuments],
      timer: 25,
      nbOfObjects: 6,
    });

    assert.deepEqual(gameConfig, {
      packs: [monuments],
      categories: [monuments],
      timer: 25,
      nbOfObjects: 6,
    });
  });

  it('reads the packs from categories when only categories is sent', () => {
    const gameConfig: GameConfig = GameConfigSchema.parse({
      categories: [monuments],
      timer: 25,
      nbOfObjects: 6,
    });

    assert.deepEqual(gameConfig.packs, [monuments]);
    assert.deepEqual(gameConfig.categories, [monuments]);
  });

  it('prefers categories when both keys are sent', () => {
    const gameConfig: GameConfig = GameConfigSchema.parse({
      packs: [monuments],
      categories: [capitals],
      timer: 25,
      nbOfObjects: 6,
    });

    assert.deepEqual(gameConfig.packs, [capitals]);
    assert.deepEqual(gameConfig.categories, [capitals]);
  });

  it('rejects a config without packs nor categories', () => {
    const result: z.SafeParseReturnType<unknown, GameConfig> =
      GameConfigSchema.safeParse({ timer: 25, nbOfObjects: 6 });

    assert.equal(result.success, false);
    assert.deepEqual(
      result.error?.issues.map(({ path }) => path),
      [['packs']],
    );
  });
});

describe('applyGameConfigChanges', () => {
  it('keeps categories aligned with the changed packs', () => {
    const gameConfig: GameConfig = GameConfigSchema.parse({
      packs: [monuments],
      timer: 25,
      nbOfObjects: 6,
    });

    const changed: GameConfig = applyGameConfigChanges({
      gameConfig,
      changes: { packs: [capitals] },
    });

    assert.deepEqual(changed, {
      packs: [capitals],
      categories: [capitals],
      timer: 25,
      nbOfObjects: 6,
    });
  });

  it('keeps the packs when another setting changes', () => {
    const gameConfig: GameConfig = GameConfigSchema.parse({
      packs: [monuments],
      timer: 25,
      nbOfObjects: 6,
    });

    const changed: GameConfig = applyGameConfigChanges({
      gameConfig,
      changes: { timer: 45 },
    });

    assert.deepEqual(changed, {
      packs: [monuments],
      categories: [monuments],
      timer: 45,
      nbOfObjects: 6,
    });
  });
});
