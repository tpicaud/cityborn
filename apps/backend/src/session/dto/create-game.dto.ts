// create-session.dto.ts

import { type CreateGameRecord, SessionMode } from '@cityborn/types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PlayerDto } from 'src/player/dto/player.dto';
import type { PlayerResultsDto } from './game.dto';
import { GameConfigDto, SessionDto } from './session.dto';

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
