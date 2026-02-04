import { Optional } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsString } from 'class-validator';

export class AppleUserDetailsDto {
  @IsString()
  email: string;

  @IsString()
  family_name: string;

  @IsString()
  given_name: string;
}

export class SignInWithAppleDto {
  @IsString()
  identity_token: string;

  @IsString()
  apple_user_id: string;

  @Optional()
  @Type(() => AppleUserDetailsDto)
  details?: AppleUserDetailsDto;
}
