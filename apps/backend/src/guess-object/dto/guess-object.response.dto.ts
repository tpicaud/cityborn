import { Type } from 'class-transformer';
import { GuessObjectDto } from './guess-object.dto';
import { IsArray, ValidateNested } from 'class-validator';

export class GuessObjectResponseDto {
  @Type(() => GuessObjectDto)
  guessObject: GuessObjectDto;
}

export class GuessObjectsResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuessObjectDto)
  guessObjects: GuessObjectDto[];
}
