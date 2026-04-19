import { Player } from '@cityborn/types';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class PlayerDto implements Player {
  @IsString()
  username: string;

  @IsBoolean()
  isGuest: boolean;

  @IsOptional()
  @IsNumber()
  id?: string;
}
