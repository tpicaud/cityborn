import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';

// Définition de l'interface Sentence
export interface Sentence {
    sentence: string;
    score_type: string;
}

// Fonction pour parser le fichier CSV
const parseSentencesCSV = async (): Promise<Sentence[]> => {
    const sentences: Sentence[] = [];
    const csvPath = path.join(process.cwd(), `data/sentences.csv`)
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csvParser())
            .on('data', (row) => {
                // Chaque ligne du fichier CSV correspond à une phrase pour chaque type de score
                if (row.Bon) {
                    sentences.push({ sentence: row.Bon, score_type: 'Bon' });
                }
                if (row.Moyen) {
                    sentences.push({ sentence: row.Moyen, score_type: 'Moyen' });
                }
                if (row.Mauvais) {
                    sentences.push({ sentence: row.Mauvais, score_type: 'Mauvais' });
                }
            })
            .on('end', () => {
                resolve(sentences);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

export { parseSentencesCSV }