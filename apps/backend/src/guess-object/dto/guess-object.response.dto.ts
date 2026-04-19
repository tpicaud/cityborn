import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { GuessObjectDto } from './guess-object.dto';

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
