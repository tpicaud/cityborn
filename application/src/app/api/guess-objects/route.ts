import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Configuration de la connexion MongoDB
const uri = process.env.NEXT_PUBLIC_MONGODB_URI || ""; // Assurez-vous que cette variable d'environnement est définie
const client = new MongoClient(uri);

// Nom de la base de données et de la collection
const dbName = "celebritiesDB";
const collectionName = "celebrities";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    try {
        // Connexion à la base de données
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Construire la pipeline
        const pipeline = []

        if (category !== 'all') {
            pipeline.push({ $match: { category } });
        }

        pipeline.push({ $sample: { size: 6 } });

        // Récupérer 6 documents aléatoires
        const randomCelebrities = await collection.aggregate(pipeline).toArray();

        // Retourner les résultats
        return NextResponse.json(randomCelebrities);
    } catch (error) {
        console.error("Erreur lors de la récupération des célébrités :", error);
        return NextResponse.json(
            { message: "Erreur lors de la récupération des célébrités." },
            { status: 500 }
        );
    } finally {
        // Fermer la connexion MongoDB
        await client.close();
    }
}
