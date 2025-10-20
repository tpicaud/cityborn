import { WorldLocation } from "./WorldLocation.js";

export interface GuessObject {
    id: string;
    name: string;
    image?: string;
    description?: string;
    short_description?: string;
    world_location_id?: string;
    world_location?: WorldLocation;
}

export type CreateGuessObject = Omit<GuessObject, 'id' | 'world_location'>;

export interface GuessObjectCandidate {
    external_id: string;
    label: string;
    description?: string
}


// export interface GuessObject {
//     id: string;
//     name: string;
//     category: string
//     description: string;
//     short_description: string;
//     image: string;
//     answer: {
//         place_name: string,
//         coordinates: {
//             type: string,
//             // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             value: any
//         }
//     }
// }