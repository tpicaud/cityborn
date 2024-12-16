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
    labels: Record<string, { value: string }>;
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

const fetchPlaceData = async (placeId: string) => {
    const cityDataUrl = `https://www.wikidata.org/wiki/Special:EntityData/${placeId}.json`;
    const cityDataResponse = await axios.get(cityDataUrl);
    return cityDataResponse.data?.entities?.[placeId] || null;
};

const fetchPlaceCoordinates = async (placeId: string, labels: Record<string, any>) => {
    const placeName = labels?.fr?.value || labels?.en?.value || '';
    const overpassUrl = "https://overpass-api.de/api/interpreter";
    const query = `
        [out:json][timeout:25];
        relation["wikidata"="${placeId}"];
        out geom;
    `;

    const answer = {
        place_name: placeName,
        coordinates: { type: '', value: {} },
    };

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
            answer.coordinates = {
                type: 'GeoJSON',
                value: cityBoundaries,
            };
        } else {
            throw new Error('Invalid geoJSON, using exact position instead');
        }
    } catch {
        console.log('Failed to fetch geoJSON, using exact location instead');
        const location = labels?.P625?.[0]?.mainsnak?.datavalue?.value;
        if (location?.latitude && location?.longitude) {
            answer.coordinates = {
                type: 'Point',
                value: {
                    lat: location.latitude,
                    lng: location.longitude,
                },
            };
        }
    }

    return answer;
};

const validateObject = (object: GuessObject): void => {
    if (!object.image) {
        throw new Error(`Image manquante pour ${object.name}`);
    }
    if (!object.answer.coordinates) {
        throw new Error(`Coordonnées manquantes pour ${object.name}`);
    }
    if (!object.answer.place_name) {
        throw new Error(`Ville de naissance manquante pour ${object.name}`);
    }
};

const getObjectFromWikipedia = async (name: string, category: string): Promise<GuessObject | null> => {
    try {
        const wikipediaPage = await fetchWikipediaPage(name);
        const wikibaseItem = wikipediaPage?.pageprops?.wikibase_item;

        if (!wikibaseItem) {
            throw new Error(`Aucune donnée Wikidata associée à "${name}".`);
        }

        const wikidataEntity = await fetchWikidataEntity(wikibaseItem);

        if (!wikidataEntity) {
            throw new Error(`Erreur dans la récupération de l'objet Wikidata associée à "${name}".`)
        }

        const image = extractImageFromWikidata(wikidataEntity);
        const placeId = wikidataEntity?.claims?.P19?.[0]?.mainsnak?.datavalue?.value?.id || '';

        const answer = placeId
            ? await fetchPlaceCoordinates(placeId, wikidataEntity.labels)
            : { place_name: '', coordinates: { type: '', value: {} } };

        const object: GuessObject = {
            name,
            category,
            description: wikipediaPage?.extract || 'Description indisponible.',
            image,
            answer,
        };

        validateObject(object);

        return object;
    } catch (error) {
        console.error('Erreur lors de la récupération des données Wikipedia ou Wikidata:', error);
    }

    return null;
};

export { getObjectFromWikipedia };
