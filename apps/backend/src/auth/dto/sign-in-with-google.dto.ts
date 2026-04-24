import { IsString } from 'class-validator';

export class SignInWithGoogleDto {
  @IsString()
  idToken: string;
}
