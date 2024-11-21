import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fetchWikipediaData } from '@/services/WikipediaService';
import GuessObject from '@/types/GuessObject';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET() {
    
    console.log('GET /api/guess-objects');

    // Définition des constantes
    const numberOfObjects = 10;
    const category = 'all';

    // Définition du tableau d'objets
    const guessObjects: GuessObject[] = [];

    try {

        // Appel de la fonction pour lire le fichier CSV
        const objects = await parseCSV();

        // Choisir 6 objets aléatoires
        const randomObjects = objects
            .filter(obj => category === 'all' || obj.category === category)
            .sort(() => Math.random() - 0.5)
            .slice(0, numberOfObjects);

        // Récupérer les informations Wikipedia pour chaque objet
        for (const obj of randomObjects) {
            const object: GuessObject | null = await getObjectFromWikipedia(obj.name);
            if (object) {
                guessObjects.push(object);
            }
            // Wait 1 sec to avoid hitting the Wikipedia API rate limit
            await new Promise(resolve => setTimeout(resolve, 1300));
        }

        // Retour des données en JSON
        return NextResponse.json(guessObjects);
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier CSV:', error);
        return NextResponse.json({ error: 'Erreur lors de la lecture du fichier CSV' }, { status: 500 });
    }
}

const parseCSV = async () => {
    // Résolution du chemin vers le fichier CSV
    const csvPath = path.join(process.cwd(), 'src/data/stars.csv');

    // Lecture du contenu du fichier CSV
    const csv = fs.readFileSync(csvPath, 'utf-8');

    // Traitement des lignes du fichier CSV
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    //const headers = lines[0].split(',');

    const objects = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
            name: values[0].trim(),
            category: values[1].trim(),
            nationality: values[2].trim(),
        };
    });

    return objects;
}

const getObjectFromWikipedia = async (name: string): Promise<GuessObject | null> => {

    try {
        //////////////////////////////////////////////////////////////////////////////////////////
        // Étape 1 : Récupérer les données depuis Wikipédia pour la description et autres métadonnées
        const wikipediaData = await fetchWikipediaData({
            titles: name,
            props: ['extracts', 'pageprops'],
            language: 'fr',
            exsentences: 2, // Limiter à 2 phrases
            explainText: true,
        });

        const page = wikipediaData?.query?.pages?.[0];
        if (!page || page.missing) {
            throw new Error(`La page Wikipedia pour "${name}" est introuvable.`);
        }

        const description = page.extract || 'Description indisponible.';
        const wikibaseInfo = page.pageprops?.wikibase_item;

        if (!wikibaseInfo) {
            throw new Error(`Aucune donnée Wikidata associée à "${name}".`);
        }

        //////////////////////////////////////////////////////////////////////////////////////////
        // Étape 2 : Récupérer les données depuis Wikidata pour l’image et le lieu de naissance
        const wikidataUrl = `https://www.wikidata.org/wiki/Special:EntityData/${wikibaseInfo}.json`;
        const wikidataResponse = await axios.get(wikidataUrl);
        const wikidata = wikidataResponse.data?.entities?.[wikibaseInfo];

        // Obtenir l'image (P18) depuis Wikidata
        const imageFileName = wikidata?.claims?.P18?.[0]?.mainsnak?.datavalue?.value || '';
        const image = imageFileName
            ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFileName)}`
            : 'Image non disponible.';

        // Obtenir l'ID du lieu de naissance (P19)
        const birthPlaceID = wikidata?.claims?.P19?.[0]?.mainsnak?.datavalue?.value?.id || '';
        //let birthPlaceName = '';
        let coordinates = { lat: 0, lng: 0 };

        if (birthPlaceID) {
            const cityDataUrl = `https://www.wikidata.org/wiki/Special:EntityData/${birthPlaceID}.json`;
            const cityDataResponse = await axios.get(cityDataUrl);
            const cityData = cityDataResponse.data?.entities?.[birthPlaceID];

            // Obtenir le nom de la ville
            //birthPlaceName = cityData?.labels?.fr?.value || cityData?.labels?.en?.value || '';

            // Obtenir les coordonnées géographiques si disponibles (P625)
            const location = cityData?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
            if (location) {
                coordinates = {
                    lat: location.latitude || 0,
                    lng: location.longitude || 0,
                };
            }
        }

        // Construire l'objet final
        const object: GuessObject = {
            name,
            description,
            image,
            coordinates,
        };

        return object;
    } catch (error) {
        console.error('Erreur lors de la récupération des données Wikipedia ou Wikidata:', error);
    }

    return null;
};
