import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Categories, GameMode, Session, SessionStatus } from '@cityborn/types';
import { RedisHTTPService } from 'src/redisHTTP/redisHTTP.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { customAlphabet } from 'nanoid';

const generateID = customAlphabet('0123456789', 6);

@Injectable()
export class SessionService {
    private readonly prefix = 'session:';

    constructor(private readonly redisService: RedisHTTPService) { }

    private getKey(id: string): string {
        return `${this.prefix}${id}`;
    }

    async create(dto: CreateSessionDto): Promise<Session> {
        const { gameMode } = dto
        const sessionID: string = await this.generateUniqueSessionID();

        try {
            const newSession: Session = {
                id: sessionID,
                hostID: gameMode === GameMode.SOLO ? 'guest' : '',
                mode: gameMode,
                status: SessionStatus.IN_LOBBY,
                gameConfig: {
                    categories: [Categories.TOUTES],
                    timer: 20,
                    nbOfObjects: 6
                },
                players: gameMode === GameMode.SOLO ? [{ id: 'guest' }] : [],
            };

            await this.redisService.setHTTP(this.getKey(newSession.id), JSON.stringify(newSession), 600);
            return newSession;
        } catch (error) {
            console.error('Error creating session:', error);
            throw new InternalServerErrorException('Unable to create session');
        }
    }

    async getById(sessionId: string): Promise<Session> {
        try {
            const session = await this.redisService.getHTTP<Session>(this.getKey(sessionId));

            if (!session) {
                throw new NotFoundException(`Session with ID "${sessionId}" not found.`);
            }

            return session;
        } catch (error) {
            throw new InternalServerErrorException('Failed to retrieve session from Redis.');
        }
    }

    private async generateUniqueSessionID(maxAttempts = 5): Promise<string> {
        let attempts = 0;

        while (attempts < maxAttempts) {
            const id = generateID();
            const exists = await this.redisService.getHTTP(this.getKey(id));

            if (!exists) return id;

            attempts++;
        }

        throw new InternalServerErrorException('Failed to generate unique session ID');
    }

}
