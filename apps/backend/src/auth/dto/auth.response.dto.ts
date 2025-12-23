import { Type } from 'class-transformer';
import { IsString } from 'class-validator';
import { UserDto } from 'src/user/dto/user.dto';

export class AuthResponseDto {
  @IsString()
  access_token: string;

  @IsString()
  refresh_token: string;

  @Type(() => UserDto)
  user: UserDto;
}
