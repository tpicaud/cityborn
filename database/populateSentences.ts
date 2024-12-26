import { addSentences } from "./database/scripts/addSentences";
import { parseSentencesCSV, Sentence } from "./utils/parseSentencesCSV";

const populateDB = async () => {

    const sentences: Sentence[] = [];

    try {
        // Appel de la fonction pour lire le fichier CSV
        console.log('Lecture du fichier CSV...');
        sentences.push(...(await parseSentencesCSV()))
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier CSV:', error);
    }

    try {
        console.log('Ajout des célébrités dans la base de données...');
        addSentences(sentences);
    } catch (error) {
        console.error('Erreur lors de l\'ajout des célébrités dans la base de données:', error);
    }
}

populateDB();