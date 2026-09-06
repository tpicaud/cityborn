import { GameStatus, RoundStatus, SessionMode } from '../schemas/enums';
import {
  type CreateGameRecord,
  defaultGameConfig,
  type Game,
  type GameConfig,
  type GameState,
  type Round,
} from '../schemas/game.schema';
import { buildPlayer } from './player.builder';

export function buildGameConfig(
  overrides: Partial<GameConfig> = {},
): GameConfig {
  return structuredClone({ ...defaultGameConfig, ...overrides });
}

export function buildGame(overrides: Partial<Game> = {}): Game {
  return structuredClone({
    id: 'game-1',
    config: buildGameConfig(),
    status: GameStatus.IN_GAME,
    state: { guessObjectsIds: [], results: {} },
    ...overrides,
  });
}

export function buildCreateGameRecord(
  overrides: Partial<CreateGameRecord> = {},
): CreateGameRecord {
  const player = buildPlayer();

  return structuredClone({
    mode: SessionMode.SOLO,
    gameConfig: buildGameConfig(),
    players: [player],
    guessObjectsIds: [],
    results: { [player.username]: { results: [] } },
    ...overrides,
  });
}

export function buildRound(overrides: Partial<Round> = {}): Round {
  return structuredClone({
    status: RoundStatus.GUESSING,
    guessObjectId: 'guess-object-1',
    ...overrides,
  });
}

export function buildGameState(overrides: Partial<GameState> = {}): GameState {
  return structuredClone({
    guessObjectsIds: [],
    results: {},
    ...overrides,
  });
}
