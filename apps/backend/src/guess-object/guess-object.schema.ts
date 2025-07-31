import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { GuessObject as GuessObjectType } from '@cityborn/types';

const guessObjectCollection = process.env.GUESS_OBJECTS_COLLECTION

export type GuessObjectDocument = GuessObject & Document;

@Schema({ _id: false })
export class Coordinates {
    @Prop({ required: true })
    type: string;


    @Prop({ required: true, type: MongooseSchema.Types.Mixed })
    value: any;
}

@Schema({ _id: false })
export class Answer {
    @Prop({ required: true })
    place_name: string;

    @Prop({ required: true, type: Coordinates })
    coordinates: Coordinates;
}

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

    @Prop({ required: true, type: Answer })
    answer: Answer;
}

export const GuessObjectSchema = SchemaFactory.createForClass(GuessObject);