import { EventMap } from '@cityborn/types';
import { IsObject, IsString } from 'class-validator';


export class CreateEventDto<Name extends keyof EventMap = keyof EventMap> {

    @IsString()
    name: Name;

    @IsString()
    userAnalyticsId: string;

    @IsObject()
    properties: EventMap[Name];
}