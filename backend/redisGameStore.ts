import { redis } from './server.ts'

type Game = {
  id: string;
  lastActivity: number;
  [key: string]: any;
};

const GAME_KEY_PREFIX = 'game:';
const GAME_TTL = 600; // secondes (10 minutes)
const GAME_COUNT_KEY = 'metrics:total_games_created';

// Ajouter une partie
export async function addGame(game: Game) {
  game.lastActivity = Date.now();
  await redis.set(`${GAME_KEY_PREFIX}${game.id}`, JSON.stringify(game), 'EX', GAME_TTL);
  await redis.incr(GAME_COUNT_KEY);
}

// Récupérer une partie
export async function getGame(gameID: string): Promise<Game | null> {
  const data = await redis.get(`${GAME_KEY_PREFIX}${gameID}`);
  return data ? JSON.parse(data) : null;
}

// Supprimer une partie
export async function removeGame(gameID: string) {
  await redis.del(`${GAME_KEY_PREFIX}${gameID}`);
}

// Mettre à jour une partie
export async function updateGame(updatedGame: Game) {
  updatedGame.lastActivity = Date.now();
  await redis.set(`${GAME_KEY_PREFIX}${updatedGame.id}`, JSON.stringify(updatedGame), 'EX', GAME_TTL);
}

// Exporter toutes les parties (à utiliser uniquement pour debug)
export async function getAllGames(): Promise<Game[]> {
  const keys = await redis.keys(`${GAME_KEY_PREFIX}*`);
  if (keys.length === 0) return [];

  const values = await redis.mget(...keys);
  return values
    .map(value => (value ? JSON.parse(value) : null))
    .filter(Boolean) as Game[];
}
