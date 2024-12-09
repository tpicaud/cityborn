import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Configuration de la connexion MongoDB
const uri = process.env.NEXT_PUBLIC_MONGODB_URI || ""; // Assurez-vous que cette variable d'environnement est définie
const client = new MongoClient(uri);

// Nom de la base de données et de la collection
const dbName = "sentencesDB";
const collectionName = "sentences";

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url)
    const score_type = searchParams.get('score_type');

    try {
        // Connexion à la base de données
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const pipeline = [
            { $match: { score_type } }, // Filtrer par score_type
            { $sample: { size: 1 } }   // Obtenir un document aléatoire
        ];
        const result = await collection.aggregate(pipeline).toArray();

        // Retourner les résultats
        return NextResponse.json(result[0]);
    } catch (error) {
        console.error("Erreur lors de la récupération de la phrase :", error);
        return NextResponse.json(
            { message: "Erreur lors de la récupération de la phrase." },
            { status: 500 }
        );
    } finally {
        // Fermer la connexion MongoDB
        await client.close();
    }
}
