import { Redis } from '@upstash/redis';

type Game = {
  id: string;
  lastActivity: number;
  [key: string]: any;
};

// Initialisation du client Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Clé préfixe pour éviter les conflits
const GAME_KEY_PREFIX = 'game:';
const GAME_TTL = 600; // secondes (10 minutes)

// Ajouter une partie
export async function addGame(game: Game) {
  game.lastActivity = Date.now();
  await redis.set(`${GAME_KEY_PREFIX}${game.id}`, game, { ex: GAME_TTL });
}

// Récupérer une partie
export async function getGame(gameID: string): Promise<Game | null> {
  const game = await redis.get<Game>(`${GAME_KEY_PREFIX}${gameID}`);
  return game;
}

// Supprimer une partie
export async function removeGame(gameID: string) {
  await redis.del(`${GAME_KEY_PREFIX}${gameID}`);
}

// Mettre à jour une partie
export async function updateGame(updatedGame: Game) {
  updatedGame.lastActivity = Date.now();
  await redis.set(`${GAME_KEY_PREFIX}${updatedGame.id}`, updatedGame, { ex: GAME_TTL });
}

// Exporter toutes les parties (à utiliser uniquement pour debug)
export async function getAllGames(): Promise<Game[]> {
  const keys = await redis.keys(`${GAME_KEY_PREFIX}*`);
  const games = await Promise.all(keys.map(key => redis.get<Game>(key)));
  return games.filter(Boolean) as Game[];
}
