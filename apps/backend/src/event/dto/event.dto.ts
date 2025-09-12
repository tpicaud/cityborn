import { Event } from '@cityborn/types';

export class EventDto implements Event {
    id: string;
    name: string;
    userAnalyticsId: string;
    properties: Record<string, any>;
    created_at: string;
}