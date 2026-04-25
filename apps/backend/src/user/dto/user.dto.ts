import type { AccountType } from '@cityborn/types';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { GameRecordDto } from 'src/session/dto/game.dto';
import { PublicUserDto } from './public-user.dto';

export class UserDto extends PublicUserDto {
  @IsString()
  type: AccountType;

  @IsString()
  email: string;

  @IsString()
  @IsOptional()
  createdAt?: string;

  @IsString()
  @IsOptional()
  updatedAt?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GameRecordDto)
  relations?: {
    games?: GameRecordDto[];
  };
}
