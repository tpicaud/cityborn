import { SessionMode } from '@cityborn/types';
import { IsEnum } from 'class-validator';

export class CreateSessionDto {
  @IsEnum(SessionMode)
  mode: SessionMode;
}
