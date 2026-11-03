import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { z } from 'zod';
import { buildPack } from '../pack/pack.builder';
import { type Pack, PackIdSchema } from '../pack/pack.schema';
import {
  applyGameConfigChanges,
  type GameConfig,
  type GameConfigPack,
  GameConfigSchema,
  type GuessSubmission,
  GuessSubmissionSchema,
} from './game.schema';

const monuments: GameConfigPack = {
  id: PackIdSchema.parse('00000000-0000-4000-8000-000000000011'),
  name: 'Monuments',
  isPublished: true,
};
const capitals: GameConfigPack = {
  id: PackIdSchema.parse('00000000-0000-4000-8000-000000000012'),
  name: 'Capitales',
  isPublished: true,
};

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

  it('drops the theme of the selected packs', () => {
    const themedMonuments: Pack = buildPack({
      id: monuments.id,
      name: monuments.name,
    });

    const gameConfig: GameConfig = GameConfigSchema.parse({
      packs: [themedMonuments],
      timer: 25,
      nbOfObjects: 6,
    });

    assert.deepEqual(gameConfig.packs, [monuments]);
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

describe('GuessSubmissionSchema', () => {
  it('accepts a guess without coordinates', () => {
    const guess: GuessSubmission = GuessSubmissionSchema.parse({});

    assert.deepEqual(guess, {});
  });

  it('rejects a guess announcing its points', () => {
    const result: z.SafeParseReturnType<unknown, GuessSubmission> =
      GuessSubmissionSchema.safeParse({
        coordinates: { lat: 48.85, lng: 2.35 },
        points: 1000,
      });

    assert.equal(result.success, false);
  });

  it('rejects coordinates outside the globe', () => {
    const result: z.SafeParseReturnType<unknown, GuessSubmission> =
      GuessSubmissionSchema.safeParse({ coordinates: { lat: 91, lng: 2.35 } });

    assert.equal(result.success, false);
  });
});
