import { PublicUser } from '@cityborn/types';
import { IsNumber, IsString, IsEmail, IsDateString } from 'class-validator';

export class PublicUserDto implements PublicUser {
  @IsNumber()
  id: number;

  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsDateString()
  createdAt?: string;

  @IsDateString()
  updatedAt?: string;
}