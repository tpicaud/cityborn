import { Type } from 'class-transformer';
import { PublicUserDto } from './public-user.dto';

export class PublicUserResponseDto {
  @Type(() => PublicUserDto)
  user: PublicUserDto;
}
