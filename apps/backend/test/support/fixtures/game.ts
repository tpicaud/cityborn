import {
  defaultGameConfig,
  type Game,
  type GameConfig,
  GameStatus,
} from '@cityborn/api';

export function buildGameConfig(
  overrides: Partial<GameConfig> = {},
): GameConfig {
  return structuredClone({ ...defaultGameConfig, ...overrides });
}

export function buildGame(overrides: Partial<Game> = {}): Game {
  return structuredClone({
    id: 'g1',
    config: buildGameConfig(),
    status: GameStatus.IN_GAME,
    state: { guessObjectsIds: [], results: {} },
    ...overrides,
  });
}
