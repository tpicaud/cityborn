import { Module } from '@nestjs/common';
import { GuessObjectController } from './guess-object.controller';
import { GuessObjectService } from './guess-object.service';
import { MongooseModule } from '@nestjs/mongoose';
import { GuessObject, GuessObjectSchema } from './guess-object.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GuessObject.name, schema: GuessObjectSchema }
    ])
  ],
  controllers: [GuessObjectController],
  providers: [GuessObjectService]
})
export class GuessObjectModule {}
