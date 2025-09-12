import { CreateEvent } from '@cityborn/types';
import { IsObject, IsString } from 'class-validator';


export class CreateEventDto implements CreateEvent {
    @IsString()
    name: string;

    @IsString()
    userAnalyticsId: string;

    @IsObject()
    properties: Record<string, any>;
}