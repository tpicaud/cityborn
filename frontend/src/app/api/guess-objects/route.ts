import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

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

        if (category !== 'Toutes') {
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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { guessObjectsIds } = body;

        if (!Array.isArray(guessObjectsIds)) {
            return NextResponse.json(
                { message: "'guessObjectsIds' doit être un tableau." },
                { status: 400 }
            );
        }

        // Connexion à la base de données
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Récupérer les objets correspondant aux IDs
        const guessObjects = await collection
            .find({ _id: { $in: guessObjectsIds.map((id: string) => new ObjectId(id)) } })
            .toArray();

        // Transformer `_id` => `id`
        const formattedObjects = guessObjects.map(obj => ({
            ...obj,
            id: obj._id.toString(),
            _id: undefined, // facultatif : on peut le supprimer si tu ne veux pas le garder
        }));

        return NextResponse.json(formattedObjects);
    } catch (error) {
        console.error("Erreur lors de la récupération des guessObjects :", error);
        return NextResponse.json(
            { message: "Erreur lors de la récupération des guessObjects." },
            { status: 500 }
        );
    } finally {
        await client.close();
    }
}
