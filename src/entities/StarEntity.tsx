export default interface StarEntity {
    name: string;
    description: string;
    image: string;
    birthPlace: {
        city: string,
        coordinates: {lat: number, lng: number}
    };
}