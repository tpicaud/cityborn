import { Event, EventMap } from '@cityborn/types';
import { IsObject, IsString } from 'class-validator';

export class EventDto<Name extends keyof EventMap = keyof EventMap> {
    @IsString()
    id: string;

    @IsString()
    name: Name;

    @IsString()
    userAnalyticsId: string;

    @IsObject()
    properties: EventMap[Name];

    @IsString()
    created_at: string;
}