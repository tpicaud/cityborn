import StarEntity from "@/entities/StarEntity";

const starList: StarEntity[] = [
    {
        name: "Roger Federer",
        description: "Joueur de tennis suisse",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Roger_Federer_Australian_Open_2020.jpg/280px-Roger_Federer_Australian_Open_2020.jpg",
        birthPlace: {
        city: "Bâle",
        coordinates: {
            lat: 47.5596,
            lng: 7.5886
        }
        }
    },
    {
        name: "Rafael Nadal",
        description: "Joueur de tennis espagnol",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Rafael_Nadal_2011_Roland_Garros_2011.jpg/250px-Rafael_Nadal_2011_Roland_Garros_2011.jpg",
        birthPlace: {
        city: "Manacor",
        coordinates: {
            lat: 39.5696,
            lng: 3.2096
        }
        }
    },
    {
        name: "Novak Djokovic",
        description: "Joueur de tennis serbe",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Novak_Djokovi%C4%87_Trophy_Wimbledon_2019-croped_and_edited.jpg/280px-Novak_Djokovi%C4%87_Trophy_Wimbledon_2019-croped_and_edited.jpg",
        birthPlace: {
        city: "Belgrade",
        coordinates: {
            lat: 44.7866,
            lng: 20.4489
        }
        }
    },
];

export { starList };