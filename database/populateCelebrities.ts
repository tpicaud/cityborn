import { GuessObject } from "./database/models/celebrity2";
import { addCelebrities } from "./database/scripts/addCelebrities2";
import { parseCelebritiesCSV } from "./utils/parseCelebritiesCSV";
import { getObjectFromWikipedia } from "./wikipediaService/getObjectFromWikipedia2";

const populateDB = async () => {

    const guessObjects: GuessObject[] = [];

    try {

        // Appel de la fonction pour lire le fichier CSV
        console.log('Lecture du fichier CSV...');
        const objects = await parseCelebritiesCSV();

        // Récupérer les informations Wikipedia pour chaque objet
        console.log('Récupération des données Wikipedia...');
        for (const obj of objects) {
            console.log(`\nRécupération des données pour ${obj.name}...`);
            const object: GuessObject | null = await getObjectFromWikipedia(obj.name, obj.category);
            if (object) {
                guessObjects.push(object);
                console.log('Done');
            }
            // Wait 1 sec to avoid hitting the Wikipedia API rate limit
            await new Promise(resolve => setTimeout(resolve, 1100));
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données Wikipedia:', error);
    }

    try {
        console.log('Ajout des célébrités dans la base de données...');
        addCelebrities(guessObjects);
    } catch (error) {
        console.error('Erreur lors de l\'ajout des célébrités dans la base de données:', error);
    }
}

populateDB();