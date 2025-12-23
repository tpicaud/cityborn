import { IsEnum } from 'class-validator';
import { SessionMode } from '@cityborn/types';

export class CreateSessionDto {
  @IsEnum(SessionMode)
  mode: SessionMode;
}
