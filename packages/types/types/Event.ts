///////////////////
// Event mapping //
///////////////////
export interface EventMap {
    user_signed_up: { method: "email" | "google" };
    user_logged_in: { method: "email" | "google" };
}

//////////////////////
// Type Event
//////////////////////
export type Event<Name extends keyof EventMap = keyof EventMap> = {
    id: string;
    visitorId: string;
    name: Name;
    properties: EventMap[Name];
    created_at: string;
};

/////////////////////////
// Type création event //
/////////////////////////
export type CreateEvent<Name extends keyof EventMap = keyof EventMap> = Omit<
    Event<Name>,
    "id" | "created_at"
>;

export function createEvent<Name extends keyof EventMap>(event: CreateEvent<Name>) {
    return event;
}
