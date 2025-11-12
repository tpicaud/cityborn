import { Type } from 'class-transformer';
import { SentenceDto } from './sentence.dto';

export class SentenceResponseDto {
  @Type(() => SentenceDto)
  sentence: SentenceDto;
}
