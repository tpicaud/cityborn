// utils/wikipediaService.ts
import axios from 'axios';

const WIKIPEDIA_API_URL = 'wikipedia.org/w/api.php';

// Interface pour définir les options de la requête
interface WikipediaQueryOptions {
  titles: string; // Les titres des articles séparés par "|"
  props: string[]; // Liste des propriétés (ex: "extracts", "pageimages", "coordinates")
  formatVersion?: number; // Version du format (par défaut 2) 
  language?: string; // Langue de l'article (par défaut "fr")
  exintro?: boolean; // Si on veut seulement l'intro du texte
  exsentences?: number; // Nombre de phrases à récupérer
  explainText?: boolean; // Si on veut seulement du texte brut
  piprop?: string[]; // Propriétés de l'image à récupérer (par ex: "thumbnail", "original")
}

// Fonction pour construire l'URL wikipedia
function buildWikipediaURL(language: string) {
    return `https://${language}.${WIKIPEDIA_API_URL}`;
}

// Fonction pour créer dynamiquement la requête à Wikipédia
const fetchWikipediaData = async (options: WikipediaQueryOptions) => {
  const {
    titles,
    props,
    formatVersion = 2,
    language = 'fr',
    exintro = true,
    exsentences = 1,
    explainText = true,
    piprop = ['thumbnail'],
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
    origin: '*', // Pour éviter les problèmes de CORS dans le navigateur
  });

  try {
    const response = await axios.get(`${buildWikipediaURL(language)}?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la requête Wikipedia:', error);
    throw new Error('La récupération des données de Wikipedia a échoué.');
  }
};

async function checkPagesValidity(noms: string[]): Promise<string[]> {
  const nomsNonTrouves: string[] = [];

  // Pour chaque nom, vérifier si la page Wikipedia existe
  for (const nom of noms) {
    //const encodedNom = encodeURIComponent(nom); // Encoder le nom pour l'URL

    try {
      // Faire la requête avec la fonction fetchWikipediaData
      const data = await fetchWikipediaData({
        titles: nom,
        props: ['info'], // Nous avons besoin de la propriété "info" pour vérifier l'existence
      });

      // Vérifier si la page existe : si l'article n'existe pas, il n'y a pas d'ID de page valide
      const pages = data.query.pages;
      const page = Object.keys(pages)[0];
      const pageId = pages[page].pageid;


      if (pageId === undefined || pageId === -1) {
        // Si l'ID de page est '-1', cela signifie que la page n'existe pas
        nomsNonTrouves.push(nom);
      }
    } catch (error) {
      console.error('Erreur lors de la requête pour', nom, error);
      nomsNonTrouves.push(nom); // Ajouter le nom à la liste si une erreur se produit
    }
  }

  return nomsNonTrouves;
}

export { checkPagesValidity };