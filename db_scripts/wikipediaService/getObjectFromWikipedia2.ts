import axios from 'axios';
import { fetchWikipediaData } from './fetchWikipediaData';
import { GuessObject } from '../database/models/celebrity';
import osmtogeojson from 'osmtogeojson';

interface WikipediaPage {
  extract: string;
  pageprops: { wikibase_item: string };
}

interface WikidataEntity {
  claims: Record<string, any>;
  labels: Record<string, any>;
}

const fetchWikipediaPage = async (
  name: string,
): Promise<WikipediaPage | null> => {
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

const fetchWikidataEntity = async (
  wikibaseItem: string,
): Promise<WikidataEntity | null> => {
  const wikidataUrl = `https://www.wikidata.org/wiki/Special:EntityData/${wikibaseItem}.json`;
  const wikidataResponse = await axios.get(wikidataUrl);
  return wikidataResponse.data?.entities?.[wikibaseItem] || null;
};

const extractImageFromWikidata = (entity: WikidataEntity): string => {
  const imageFileName =
    entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value || '';
  return imageFileName
    ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFileName)}`
    : '';
};

const fetchCoordinatesFromWikidata = async (place_id: string) => {
  // Fetch wikidata entity of the place
  const entity = await fetchWikidataEntity(place_id);
  if (!entity) {
    throw new Error(`ID ${place_id} does not exist on Wikidata`);
  }

  // Get location from wikidata labels
  const location = entity.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
  console.log(location);
  if (location?.latitude && location?.longitude) {
    return {
      lat: location.latitude,
      lng: location.longitude,
    };
  }
  return null;
};

const fetchPlaceNameFromWikidata = async (
  place_id: string,
): Promise<string> => {
  const entity = await fetchWikidataEntity(place_id);
  if (!entity) {
    throw new Error(`ID ${place_id} does not exist on Wikidata`);
  }
  const placeName = entity.labels?.fr?.value || entity.labels?.en?.value || '';

  return placeName as string;
};

const fetchAnswer = async (wikidataEntity: WikidataEntity) => {
  // Extract place ID
  const placeId =
    wikidataEntity.claims?.P19?.[0]?.mainsnak?.datavalue?.value?.id || null;
  if (!placeId) {
    throw new Error(`Aucun id wikidata trouvé pour "${placeId}".`);
  }

  // Extract place name
  const placeName = await fetchPlaceNameFromWikidata(placeId);
  console.log(placeName);

  const answer = {
    place_name: placeName,
    coordinates: { type: '', value: {} },
  };

  // Try fetch boundaries, use exact location instead
  try {
    // Fetch Boundaries
    const geoJSON = await fetchBoundariesFromOverpassAPI(placeId);
    answer.coordinates.type = 'GeoJSON';
    answer.coordinates.value = geoJSON;
  } catch (error) {
    console.log('Failed to fetch geoJSON, using exact location instead');
    answer.coordinates.type = 'Point';

    try {
      const value = await fetchCoordinatesFromWikidata(placeId);
      console.log(value);
      if (!value) {
        throw new Error();
      }
      answer.coordinates.value = value;
    } catch (error) {
      throw new Error(`Exact location not available`);
    }
  }

  return answer;
};

const fetchBoundariesFromOverpassAPI = async (place_id: string) => {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
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

    const cityCenter = await fetchCoordinatesFromWikidata(place_id);

    const geoJSON = osmtogeojson(data);
    const cityBoundaries = geoJSON.features[0];

    if (cityBoundaries) {
      return {
        cityCenter: cityCenter,
        boundaries: cityBoundaries,
      };
    } else {
      throw new Error(`Boundaries not found for ${place_id}`);
    }
  } catch (error) {
    throw new Error(
      `Error while while fetching overpass api data using place_id: ${error}`,
    );
  }
};

const validateObject = (object: GuessObject): void => {
  if (!object.image) {
    throw new Error(`Image manquante pour ${object.name}`);
  }
  if (!object.answer.place_name) {
    throw new Error(`Lieu manquant sur wikidata pour ${object.name}`);
  }
  if (!object.answer.coordinates) {
    throw new Error(`Coordonnées manquantes pour ${object.name}`);
  }
};

const getObjectFromWikipedia = async (
  name: string,
  category: string,
  short_description: string,
): Promise<GuessObject | null> => {
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
      throw new Error(
        `Erreur dans la récupération de l'objet Wikidata associée à "${name}".`,
      );
    }

    // Extract image from wikidata if available
    const image = extractImageFromWikidata(wikidataEntity);

    // Extract place name and coordinates or boundaries
    const answer = await fetchAnswer(wikidataEntity);

    // Object creation
    const object: GuessObject = {
      name,
      category,
      description: wikipediaPage?.extract || 'Description indisponible.',
      short_description: short_description,
      image,
      answer,
    };

    // Test object validity
    try {
      validateObject(object);
    } catch (error) {
      throw new Error(`Objet invalide pour ${object.name}: ${error}`);
    }

    // Returning object
    return object;
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des données Wikipedia ou Wikidata:',
      error,
    );
  }

  return null;
};

export { getObjectFromWikipedia };
