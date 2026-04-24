import { IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsString()
  identifier: string;

  @IsString()
  password: string;
}
