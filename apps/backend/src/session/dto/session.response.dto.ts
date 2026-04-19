import { Type } from 'class-transformer';
import { SessionDto } from './session.dto';

export class SessionResponseDto {
  @Type(() => SessionDto)
  session: SessionDto;
}
