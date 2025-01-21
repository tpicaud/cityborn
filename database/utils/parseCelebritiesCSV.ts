import fs from 'fs';
import path from 'path';

export interface Celebrity {
    name: string,
    category: string,
    nationality: string,
    short_description: string
}

const parseCelebritiesCSV = async (): Promise<Celebrity[]> => {
    // Résolution du chemin vers le fichier CSV
    const csvPath = path.join(process.cwd(), 'data/celebrities.csv');

    // Lecture du contenu du fichier CSV
    const csv = fs.readFileSync(csvPath, 'utf-8');

    // Traitement des lignes du fichier CSV
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    //const headers = lines[0].split(',');
    const objects: Celebrity[] = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
            name: values[0].trim(),
            category: values[1].trim(),
            nationality: values[2].trim(),
            short_description: values[3].trim(),
        };
    });

    return objects;
}

export { parseCelebritiesCSV };