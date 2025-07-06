import { Injectable } from '@nestjs/common';
import { GameMode, Session, SessionStatus } from '@cityborn/types';

@Injectable()
export class SessionService {
    async findOne(id: string): Promise<Session> {
        return {
            id:'',
            hostID: '',
            mode: GameMode.MULTI,
            status: SessionStatus.IN_LOBBY,
            gameConfig: {
                categories: [],
                timer: 0,
                nbOfObjects: 0
            },
            players: []
        };
    }
}
