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
export const fetchWikipediaData = async (options: WikipediaQueryOptions) => {
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
