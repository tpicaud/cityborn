export const celebrityCollection = "celebrities";

export interface GuessObject {
    name: string;
    category: string;
    description: string;
    short_description: string;
    image: string;
    answer: {
        place_name: string,
        coordinates: {
            type: string,
            value: any
        }
    }
}
