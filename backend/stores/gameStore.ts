import Redis from 'ioredis';

type Game = {
	id: string;
	lastActivity: number;
	[key: string]: any;
};

// Ajouter une partie
export class GameStore {

	private redis: Redis;
	private GAME_TTL = 600; // secondes (10 minutes)

	constructor(redis: Redis) {
		this.redis = redis;
	}

	key(gameID: string) {
		return `game:${gameID}`;
	}

	// Mettre à jour une partie
	async saveGame(game: Game) {
		await this.redis.set(this.key(game.id), JSON.stringify(game), 'EX', this.GAME_TTL);
	}

	// Récupérer une partie
	async getGame(gameID: string): Promise<Game | null> {
		const data = await this.redis.get(this.key(gameID));
		return data ? JSON.parse(data) : null;
	}

	// Supprimer une partie
	async deleteGame(gameID: string) {
		await this.redis.del(this.key(gameID));
	}
}