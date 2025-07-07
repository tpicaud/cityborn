// create-session.dto.ts
import { IsEnum, IsObject, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GameMode, GameConfig } from '@cityborn/types';

export class CreateGameDto {
  @IsEnum(GameMode)
  gameMode: GameMode;

  @IsString()
  hostID: string;

  @IsArray()
  @IsString({ each: true }) // vérifie que chaque élément est une string
  playersID: string[];

  @IsObject()
  @Type(() => Object) // utile si tu comptes imbriquer + valider gameConfig
  gameConfig: GameConfig;
}
