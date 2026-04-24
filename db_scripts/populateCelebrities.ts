import type { GuessObject } from './database/models/celebrity';
import { addCelebrities } from './database/scripts/addCelebrities';
import { parseCelebritiesCSV } from './utils/parseCelebritiesCSV';
import { getObjectFromWikipedia } from './wikipediaService/getObjectFromWikipedia2';

const populateDB = async () => {
  const guessObjects: GuessObject[] = [];
  const nonGeoJSONObjects: { name: string; reason: string }[] = []; // Liste des objets sans GeoJSON et leurs raisons

  try {
    // Appel de la fonction pour lire le fichier CSV
    console.log('Lecture du fichier CSV...');
    const objects = await parseCelebritiesCSV();

    // Récupérer les informations Wikipedia pour chaque objet
    console.log('Récupération des données Wikipedia...');
    for (const obj of objects) {
      console.log(`\nRécupération des données pour ${obj.name}...`);
      const object: GuessObject | null = await getObjectFromWikipedia(
        obj.name,
        obj.category,
        obj.short_description,
      );

      if (object) {
        if (object.answer.coordinates.type !== 'GeoJSON') {
          nonGeoJSONObjects.push({
            name: obj.name,
            reason: `Type de coordonnées : ${object.answer.coordinates.type}`,
          });
        }
        guessObjects.push(object);
        console.log('Done');
      } else {
        nonGeoJSONObjects.push({
          name: obj.name,
          reason: `Impossible de récupérer les données Wikidata ou Wikipedia.`,
        });
      }

      // Wait 1 sec to avoid hitting the Wikipedia API rate limit
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des données Wikipedia:',
      error,
    );
  }

  try {
    console.log('Ajout des célébrités dans la base de données...');
    addCelebrities(guessObjects);
  } catch (error) {
    console.error(
      "Erreur lors de l'ajout des célébrités dans la base de données:",
      error,
    );
  }

  // Afficher la liste des objets sans GeoJSON
  console.log('\nPersonnalités sans coordonnées de type GeoJSON :');
  nonGeoJSONObjects.forEach(({ name, reason }) => {
    console.log(`- ${name}: ${reason}`);
  });
};

populateDB();
