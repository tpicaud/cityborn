import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { GuessObject as GuessObjectType } from '@cityborn/types';

export type GuessObjectDocument = GuessObject & Document;

@Schema()
export class GuessObject implements GuessObjectType {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    category: string;

    @Prop()
    description: string;

    @Prop({ required: true })
    short_description: string;

    @Prop()
    image: string;

    @Prop({ required: true })
    answer: { place_name: string; coordinates: { type: string; value: any; }; };
}

export const GuessObjectSchema = SchemaFactory.createForClass(GuessObject);