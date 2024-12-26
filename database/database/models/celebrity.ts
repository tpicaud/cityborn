export const celebrityCollection = "celebrities";

export interface GuessObject {
    name: string;
    category: string;
    description: string;
    image: string;
    city: string;
    coordinates: { lat: number; lng: number };
}
