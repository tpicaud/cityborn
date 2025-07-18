import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Categories, GameMode, SessionStatus, Session as SessionType } from '@cityborn/types';

export type SessionDocument = Session & Document;

@Schema({ _id: false })
export class GameConfig {
    @Prop({ type: [String], enum: Categories, required: true })
    categories: Categories[];

    @Prop({ required: true })
    timer: number;

    @Prop({ required: true })
    nbOfObjects: number;
}

@Schema({ _id: false })
export class Player {
    @Prop({ required: true })
    id: string;
}


@Schema()
export class Session implements SessionType {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    hostID: string;

    @Prop({ required: true, enum: GameMode })
    mode: GameMode;

    @Prop({ required: true, enum: SessionStatus })
    status: SessionStatus;

    @Prop({ required: true, type: GameConfig })
    gameConfig: GameConfig;

    @Prop({ required: true, type: [Player] })
    players: Player[];

    @Prop()
    currentGameId?: string;
}
export const SessionSchema = SchemaFactory.createForClass(Session);