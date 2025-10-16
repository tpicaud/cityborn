export interface GuessObject {
    id: string;
    name: string;
    description?: string;
    short_description?: string;
    location?: Location;
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