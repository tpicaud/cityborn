import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PublicUserDto } from './public-user.dto';
import { Type } from 'class-transformer';
import { GameRecordDto } from 'src/session/dto/game.dto';

export class UserDto extends PublicUserDto {
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
