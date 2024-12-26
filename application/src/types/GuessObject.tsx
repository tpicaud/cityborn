export default interface GuessObject {
    name: string;
    category: string
    description: string;
    image: string;
    answer: {
        place_name: string,
        coordinates: {
            type: string,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            value: any
        }
    }
}