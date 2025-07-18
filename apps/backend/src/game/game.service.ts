import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { RedisHTTPService } from 'src/redisHTTP/redisHTTP.service';
import { CreateGameDto } from './dto/create-game.dto';
import { Game, GameConfig, GameMode, GameStatus, GuessObject, Player } from '@cityborn/types';
import { GuessObjectService } from 'src/guess-object/guess-object.service';
import { IdService } from 'src/id/id.service';

@Injectable()
export class GameService {
    private readonly prefix = 'game:';

    constructor(
        private readonly redisHTTPService: RedisHTTPService,
        private readonly guessObjectService: GuessObjectService,
        private readonly idService: IdService
    ) { }

    private getKey(id: string): string {
        return `${this.prefix}${id}`;
    }

    async create(dto: CreateGameDto): Promise<Game> {
        const { gameConfig, hostID, gameMode, playersID } = dto;

        try {
            // Fetch guess objects
            const fetchedGuessObjects = await this.guessObjectService.findByGameConfig(gameConfig);

            let newGame: Game;

            switch (gameMode) {
                case GameMode.SOLO:
                    newGame = await this.createSoloGame(gameConfig, hostID, gameMode, fetchedGuessObjects);
                    break;

                case GameMode.MULTI:
                    newGame = await this.createMultiGame(gameConfig, hostID, gameMode, playersID, fetchedGuessObjects);
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
            const game = await this.redisHTTPService.getHTTP<Game>(this.getKey(gameId));

            if (!game) {
                throw new NotFoundException(`Session with ID "${gameId}" not found.`);
            }

            return game;
        } catch (error) {
            throw new InternalServerErrorException('Failed to retrieve session from Redis.');
        }
    }

    private async createSoloGame(gameConfig: GameConfig, hostID: string, gameMode: GameMode, guessObjects: GuessObject[]): Promise<Game> {
        const players: Player[] = [{
            id: hostID
        }]

        const newSoloGame: Game = {
            id: await this.idService.generateSoloGameID(),
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

    private async createMultiGame(gameConfig: GameConfig, hostID: string, gameMode: GameMode, playersID: string[], guessObjects: GuessObject[]): Promise<Game> {
        const players: Player[] = playersID.map((playerID) => {
            return { id: playerID, connected: false }
        });

        const newMultiGame: Game = {
            id: await this.idService.generateMultiGameID(),
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
