import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {

    // Définition des constantes
    const numberOfObjects = 181;
    const category = 'all';

    try {

        // Appel de la fonction pour lire le fichier CSV
        const objects = await parseCSV();

        // Choisir 6 objets aléatoires
        const randomObjects = objects
            .filter(obj => category === 'all' || obj.category === category)
            .sort(() => Math.random() - 0.5)
            .slice(0, numberOfObjects);

        // Retour des données en JSON
        return NextResponse.json(randomObjects);
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier CSV:', error);
        return NextResponse.json({ error: 'Erreur lors de la lecture du fichier CSV' }, { status: 500 });
    }
}

const parseCSV = async () => {
    // Résolution du chemin vers le fichier CSV
    const csvPath = path.join(process.cwd(), 'src/data/stars.csv');

    // Lecture du contenu du fichier CSV
    const csv = fs.readFileSync(csvPath, 'utf-8');

    // Traitement des lignes du fichier CSV
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',');

    const objects = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
            name: values[0].trim(),
            category: values[1].trim(),
            link: values[2].trim(),
        };
    });

    return objects;
}