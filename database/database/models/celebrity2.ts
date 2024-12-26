export const celebrityCollection = "celebrities2";

export interface GuessObject {
    name: string;
    category: string;
    description: string;
    image: string;
    answer: {
        place_name: string,
        coordinates: {
            type: string,
            value: any
        }
    }
}
