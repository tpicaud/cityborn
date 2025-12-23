// create-session.dto.ts
import {
  IsArray,
  IsEnum,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GameConfigDto, SessionDto } from './session.dto';
import { CreateGameRecord, SessionMode } from '@cityborn/types';
import { PlayerDto } from 'src/player/dto/player.dto';
import { PlayerResultsDto } from './game.dto';

export class CreateGameDto {
  @IsObject()
  @Type(() => SessionDto)
  session: SessionDto;
}

export class CreateGameRecordDto implements CreateGameRecord {
  @IsEnum(SessionMode)
  mode: SessionMode;

  @Type(() => GameConfigDto)
  gameConfig: GameConfigDto;

  @IsArray()
  @ValidateNested()
  @Type(() => PlayerDto)
  players: PlayerDto[];

  @IsArray()
  @IsString({ each: true })
  guessObjectsIds: string[];

  @IsObject()
  results: Record<string, PlayerResultsDto>;
}
