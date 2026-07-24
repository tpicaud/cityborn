import axios from 'axios';

const WIKIPEDIA_API_URL = 'wikipedia.org/w/api.php';

interface WikipediaQueryOptions {
  titles: string;
  props: string[];
  formatVersion?: number;
  language?: string;
  exintro?: boolean;
  exsentences?: number;
  explainText?: boolean;
  piprop?: string[];
}

function buildWikipediaURL(language: string) {
  return `https://${language}.${WIKIPEDIA_API_URL}`;
}

const fetchWikipediaData = async (options: WikipediaQueryOptions) => {
  const {
    titles,
    props = ['pageprops', 'extracts', 'pageimages', 'coordinates'],
    formatVersion = 2,
    language = 'fr',
    exintro = true,
    exsentences = 1,
    explainText = true,
    piprop = ['original'],
  } = options;

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: formatVersion.toString(),
    prop: props.join('|'),
    titles,
    exintro: exintro ? 'true' : 'false',
    exsentences: exsentences.toString(),
    explaintext: explainText ? 'true' : 'false',
    piprop: piprop.join('|'),
    origin: '*',
  });

  try {
    const response = await axios.get(
      `${buildWikipediaURL(language)}?${params.toString()}`,
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la requête Wikipedia:', error);
    throw new Error('La récupération des données de Wikipedia a échoué.');
  }
};

async function checkPagesValidity(noms: string[]): Promise<string[]> {
  const nomsNonTrouves: string[] = [];

  for (const nom of noms) {
    try {
      const data = await fetchWikipediaData({
        titles: nom,
        props: ['info'],
      });

      const pages = data.query.pages;
      const page = Object.keys(pages)[0];
      const pageId = pages[page].pageid;

      if (pageId === undefined || pageId === -1) {
        nomsNonTrouves.push(nom);
      }
    } catch (error) {
      console.error('Erreur lors de la requête pour', nom, error);
      nomsNonTrouves.push(nom);
    }
  }

  return nomsNonTrouves;
}

export { checkPagesValidity, fetchWikipediaData };
