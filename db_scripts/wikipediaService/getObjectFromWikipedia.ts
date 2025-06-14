import axios from 'axios';
import { fetchWikipediaData } from './fetchWikipediaData';
import { GuessObject } from '../database/models/celebrity';

const getObjectFromWikipedia = async (name: string, category: string): Promise<GuessObject | null> => {

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
            : '';

        // Obtenir l'ID du lieu de naissance (P19)
        const birthPlaceID = wikidata?.claims?.P19?.[0]?.mainsnak?.datavalue?.value?.id || '';
        let birthPlaceName = '';
        let coordinates = { lat: 0, lng: 0 };

        if (birthPlaceID) {
            const cityDataUrl = `https://www.wikidata.org/wiki/Special:EntityData/${birthPlaceID}.json`;
            const cityDataResponse = await axios.get(cityDataUrl);
            const cityData = cityDataResponse.data?.entities?.[birthPlaceID];

            // Obtenir le nom de la ville
            birthPlaceName = cityData?.labels?.fr?.value || cityData?.labels?.en?.value || '';

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
            category,
            description,
            image,
            city: birthPlaceName,
            coordinates,
        };

        //check data validity
        switch (true) {
            case object.image.length === 0:
                throw new Error(`Image manquante pour ${object.name}`);
            
            case object.coordinates.lat === 0 && object.coordinates.lng === 0:
                throw new Error(`Coordonnées manquantes pour ${object.name}`);
            
            case object.city.length === 0:
                throw new Error(`Ville de naissance manquante pour ${object.name}`);
            
            default:
                // Aucun problème détecté, on continue normalement
                break;
        }
        

        return object;
    } catch (error) {
        console.error('Erreur lors de la récupération des données Wikipedia ou Wikidata:', error);
    }

    return null;
};

export { getObjectFromWikipedia };