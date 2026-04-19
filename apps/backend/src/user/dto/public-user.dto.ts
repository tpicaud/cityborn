import type { PublicUser } from '@cityborn/types';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class PublicUserDto implements PublicUser {
  @IsNumber()
  id: string;

  @IsString()
  username: string;
}
