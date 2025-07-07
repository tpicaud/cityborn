import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { GameConfig, GameMode, Player, SessionStatus, Session as SessionType } from '@cityborn/types';

export type SessionDocument = Session & Document;

@Schema()
export class Session implements SessionType {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    hostID: string;

    @Prop({ required: true })
    mode: GameMode;

    @Prop({ required: true })
    status: SessionStatus;

    @Prop({ required: true })
    gameConfig: GameConfig;

    @Prop({ required: true })
    players: Player[];

    @Prop()
    currentGameId?: string | undefined;

}

export const SessionSchema = SchemaFactory.createForClass(Session);