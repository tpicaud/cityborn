import { PublicUser } from '@cityborn/types';
import { IsNumber, IsString, IsBoolean } from 'class-validator';

export class PublicUserDto implements PublicUser {
  @IsNumber()
  id: number;

  @IsString()
  username: string;

  @IsBoolean()
  isVerified: boolean;
}