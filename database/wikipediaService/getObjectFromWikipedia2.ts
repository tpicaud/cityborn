import axios from 'axios';
import { fetchWikipediaData } from './fetchWikipediaData';
import { GuessObject } from '../database/models/celebrity2';
import osmtogeojson from 'osmtogeojson';

interface WikipediaPage {
    extract: string;
    pageprops: { wikibase_item: string };
}

interface WikidataEntity {
    claims: Record<string, any>;
    labels: Record<string, any>;
}

const fetchWikipediaPage = async (name: string): Promise<WikipediaPage | null> => {
    const wikipediaData = await fetchWikipediaData({
        titles: name,
        props: ['extracts', 'pageprops'],
        language: 'fr',
        exsentences: 2,
        explainText: true,
    });

    const page = wikipediaData?.query?.pages?.[0];
    if (!page || page.missing) {
        throw new Error(`La page Wikipedia pour "${name}" est introuvable.`);
    }

    return {
        extract: page.extract || 'Description indisponible.',
        pageprops: page.pageprops || {},
    };
};

const fetchWikidataEntity = async (wikibaseItem: string): Promise<WikidataEntity | null> => {
    const wikidataUrl = `https://www.wikidata.org/wiki/Special:EntityData/${wikibaseItem}.json`;
    const wikidataResponse = await axios.get(wikidataUrl);
    return wikidataResponse.data?.entities?.[wikibaseItem] || null;
};

const extractImageFromWikidata = (entity: WikidataEntity): string => {
    const imageFileName = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value || '';
    return imageFileName
        ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFileName)}`
        : '';
};

const extractCoordinatesValueFromWikidata = (entity: WikidataEntity) => {
    // Get location from wikidata labels
    const location = entity.labels?.P625?.[0]?.mainsnak?.datavalue?.value;
    if (location?.latitude && location?.longitude) {
        return {
            lat: location.latitude,
            lng: location.longitude,
        };
    }
}

const fetchAnswer = async (wikidataEntity: WikidataEntity) => {

    // Extract place name
    const placeName = wikidataEntity.labels?.fr?.value || wikidataEntity.labels?.en?.value || '';
    if (!placeName) {
        throw new Error(`Aucun nom trouvé pour sur wikidata`)
    }

    // Extract place ID
    const placeId = wikidataEntity.claims?.P19?.[0]?.mainsnak?.datavalue?.value?.id || null;
    if (!placeId) {
        throw new Error(`Aucun id wikidata trouvé pour "${placeName}".`)
    }

    const answer = {
        place_name: placeName,
        coordinates: { type: '', value: {} },
    };

    // Try fetch boundaries, use exact location instead
    try {
        // Fetch Boundaries
        const boundaries = await fetchBoundariesFromOverpassAPI(placeId);
        answer.coordinates.type = 'GeoJSON';
        answer.coordinates.value = boundaries;
    } catch {
        console.log('Failed to fetch geoJSON, using exact location instead');
        answer.coordinates.type = 'Point'

        try {
            const value = extractCoordinatesValueFromWikidata(wikidataEntity);
            if (!value) {
                throw new Error;
            }
            answer.coordinates.value = value
        } catch (error) {
            throw new Error(`Exact location not available`)
        }
    }

    return answer;
};

const fetchBoundariesFromOverpassAPI = async (place_id: string) => {

    const overpassUrl = "https://overpass-api.de/api/interpreter";
    const query = `
        [out:json][timeout:25];
        relation["wikidata"="${place_id}"];
        out geom;
    `;

    try {
        const response = await fetch(overpassUrl, {
            method: 'POST',
            body: query,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        if (!response.ok) throw new Error(`Error: ${response.status}`);

        const data = await response.json();
        const cityBoundaries = osmtogeojson(data).features[0];

        if (cityBoundaries) {
            return cityBoundaries
        } else {
            throw new Error(`Boundaries not found for ${place_id}`);
        }
    } catch (error) {
        throw new Error(`Error while while fetching overpass api data using place_id: ${error}`)
    }
}

const validateObject = (object: GuessObject): void => {
    if (!object.image) {
        throw new Error(`Image manquante pour ${object.name}`);
    }
    if (!object.answer.place_name) {
        throw new Error(`Lieu manquant sur wikidata pour ${object.name}`)
    }
    if (!object.answer.coordinates) {
        throw new Error(`Coordonnées manquantes pour ${object.name}`);
    }
};

const getObjectFromWikipedia = async (name: string, category: string): Promise<GuessObject | null> => {
    try {

        // Get wikipedia page
        const wikipediaPage = await fetchWikipediaPage(name);
        const wikibaseItem = wikipediaPage?.pageprops?.wikibase_item;
        if (!wikibaseItem) {
            throw new Error(`Aucune donnée Wikidata associée à "${name}".`);
        }

        // Get associate wikidata item
        const wikidataEntity = await fetchWikidataEntity(wikibaseItem);
        if (!wikidataEntity) {
            throw new Error(`Erreur dans la récupération de l'objet Wikidata associée à "${name}".`)
        }

        // Extract image from wikidata if available
        const image = extractImageFromWikidata(wikidataEntity);

        // Extract place name and coordinates or boundaries
        const answer = await fetchAnswer(wikidataEntity)

        // Object creation
        const object: GuessObject = {
            name,
            category,
            description: wikipediaPage?.extract || 'Description indisponible.',
            image,
            answer,
        };

        // Test object validity
        try {
            validateObject(object);
        } catch (error) {
            throw new Error(`Objet invalide pour ${object.name}: ${error}`)
        }

        // Returning object
        return object;
    } catch (error) {
        console.error('Erreur lors de la récupération des données Wikipedia ou Wikidata:', error);
    }

    return null;
};

export { getObjectFromWikipedia };
