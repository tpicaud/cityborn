// create-session.dto.ts
import { IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { GameConfigDto } from './game.dto';

export class CreateGameDto {
  @IsObject()
  @Type(() => GameConfigDto)
  gameConfig: GameConfigDto;
}
