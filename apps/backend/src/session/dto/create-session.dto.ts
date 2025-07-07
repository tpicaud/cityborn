import { IsEnum } from 'class-validator';
import { GameMode } from '@cityborn/types';

export class CreateSessionDto {
  @IsEnum(GameMode)
  gameMode: GameMode;
}
