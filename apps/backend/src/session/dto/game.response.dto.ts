import { Type } from 'class-transformer';
import { GameDto, GameRecordDto } from './game.dto';

export class GameResponseDto {
  @Type(() => GameDto)
  game: GameDto;
}

export class GameRecordsResponseDto {
  @Type(() => GameRecordDto)
  gameRecords: GameRecordDto[];
}
