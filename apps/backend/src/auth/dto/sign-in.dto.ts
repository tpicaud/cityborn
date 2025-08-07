import { IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsString()
  identifier: string;

  @IsString()
  @MinLength(6)
  password: string;
}
