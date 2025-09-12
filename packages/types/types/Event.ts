export interface Event {
    id: string;
    name: string;
    userAnalyticsId: string;
    properties: Record<string, any>;
    created_at: string;
}

export type CreateEvent = Omit<Event, 'id' | 'created_at'>;