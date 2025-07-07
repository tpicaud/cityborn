import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Sentence as SentenceType } from '@cityborn/types';

export type SentenceDocument = Sentence & Document;

@Schema()
export class Sentence implements SentenceType {
  @Prop({ required: true })
  sentence: string;

  @Prop()
  score_type: string;
}

export const SentenceSchema = SchemaFactory.createForClass(Sentence);
