import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { CreateGameDto } from './dto/create-game.dto';
import { Game, GameConfig, GameMode, GameStatus, GuessObject, Player } from '@cityborn/types';
import { GuessObjectService } from 'src/guess-object/guess-object.service';
import { IdService } from 'src/id/id.service';

@Injectable()
export class GameService {
    private readonly prefix = 'game:';

    constructor(
        private readonly redisService: RedisService,
        private readonly guessObjectModule: GuessObjectService,
        private readonly idService: IdService
    ) { }

    private getKey(id: string): string {
        return `${this.prefix}${id}`;
    }

    async create(dto: CreateGameDto): Promise<Game> {
        const { gameConfig, hostID, gameMode, playersID } = dto;

        try {
            // Fetch guess objects
            const fetchedGuessObjects = await this.guessObjectModule.findByGameConfig(gameConfig);

            let newGame: Game;

            switch (gameMode) {
                case GameMode.SOLO:
                    newGame = this.createSoloGame(gameConfig, hostID, gameMode, fetchedGuessObjects);
                    break;

                case GameMode.MULTI:
                    newGame = this.createMultiGame(gameConfig, hostID, gameMode, playersID, fetchedGuessObjects);
                    break;

                default:
                    throw new Error(`Unsupported game mode: ${gameMode}`);
            }

            return newGame;
        } catch (error) {
            console.error('Error while creating game:', error);
            throw new Error('An error occurred while creating the game.');
        }
    }


    async getById(gameId: string): Promise<Game> {
        try {
            const game = await this.redisService.getHTTP<Game>(this.getKey(gameId));

            if (!game) {
                throw new NotFoundException(`Session with ID "${gameId}" not found.`);
            }

            return game;
        } catch (error) {
            throw new InternalServerErrorException('Failed to retrieve session from Redis.');
        }
    }

    private createSoloGame(gameConfig: GameConfig, hostID: string, gameMode: GameMode, guessObjects: GuessObject[]): Game {
        const players: Player[] = [{
            id: hostID
        }]

        const newSoloGame: Game = {
            id: this.idService.generateSoloGameId(),
            hostID: hostID,
            mode: gameMode,
            status: GameStatus.STARTING,
            gameConfig,
            players: players,
            state: {
                guessObjectsIds: guessObjects.map(guessObject => guessObject.id),
                currentRound: undefined,
                results: {},
                guessObjects: guessObjects,
            }
        }

        return newSoloGame;
    }

    private createMultiGame(gameConfig: GameConfig, hostID: string, gameMode: GameMode, playersID: string[], guessObjects: GuessObject[]): Game {
        const players: Player[] = playersID.map((playerID) => {
            return { id: playerID, connected: false }
        });

        const newMultiGame: Game = {
            id: this.idService.generateMultiGameId(),
            hostID: hostID,
            mode: gameMode,
            status: GameStatus.STARTING,
            gameConfig,
            players: players,
            state: {
                guessObjectsIds: guessObjects.map(guessObject => guessObject.id),
                currentRound: undefined,
                results: {},
                guessObjects: guessObjects,
            }
        }

        return newMultiGame;
    }
}
