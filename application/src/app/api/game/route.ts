import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { GameStatus } from "@/enums/GameStatus";
import Game from "@/types/Game";
import GameConfig from "@/types/GameConfig";
import GuessObject from "@/types/GuessObject";
import { Categories } from "@/enums/Categories";
import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator";

// Configuration de la connexion MongoDB
const uri = process.env.NEXT_PUBLIC_MONGODB_URI || "";
const client = new MongoClient(uri);

// Nom de des bases de données et des collections
const gameDB = process.env.NEXT_PUBLIC_GAMES_DB || '';
const gameCollection = process.env.NEXT_PUBLIC_GAMES_COLLECTION || '';
const celebritiesDB = process.env.NEXT_PUBLIC_CELEBRITIES_DB || ''
const celebritiesCollection = process.env.NEXT_PUBLIC_CELEBRITIES_COLLECTION || ''

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { hostID, gameMode, gameConfig } = body;

        if (!hostID || !gameMode || !gameConfig) {
            return NextResponse.json(
                { message: "hostID, gameMode et gameConfig sont requis." },
                { status: 400 }
            ); 
        }

        // Fetch guessObjects
        const guessObjects = await fetchGuessObjects(gameConfig);

        // Connexion à la base de données
        await client.connect();
        const db = client.db(gameDB);
        const collection = db.collection(gameCollection);

        // fetch

        // Création de la nouvelle game
        const newGame: Game = {
            id: uniqueNamesGenerator({
                dictionaries: [adjectives, colors, animals],
                separator: '-',
                length: 3
            }),
            mode: gameMode,
            hostID,
            status: GameStatus.LOBBY, // statut initial du jeu
            gameConfig,
            players: [hostID],
            guessObjects: guessObjects,
            currentRound: undefined,
        };

        // Insérer la nouvelle game dans la base de données
        await collection.insertOne(newGame);

        return NextResponse.json(newGame, { status: 201 });
    } catch (error) {
        console.error("Erreur lors de la création de la game:", error);
        return NextResponse.json(
            { message: "Erreur lors de la création de la game." },
            { status: 500 }
        );
    } finally {
        // Fermer la connexion MongoDB
        await client.close();
    }
}

async function fetchGuessObjects(gameConfig: GameConfig): Promise<GuessObject[]> {
    try {
        // Connexion à la base de données
        await client.connect();
        const db = client.db(celebritiesDB);
        const collection = db.collection(celebritiesCollection);

        // Construire la pipeline d'agrégation
        const pipeline: any[] = [];

        // Filtrer par catégories si nécessaire
        if (gameConfig.categories.length > 0 || gameConfig.categories.includes(Categories.TOUTES)) {
            pipeline.push({ $match: { category: { $in: gameConfig.categories } } });
        }

        // Sélectionner un nombre aléatoire d'objets
        pipeline.push({ $sample: { size: gameConfig.nbOfObjects } });

        // Exécuter l'agrégation
        const randomCelebrities = await collection.aggregate(pipeline).toArray();

        // Map response in guessObjects
        const guessObjects: GuessObject[] = randomCelebrities
            .filter((doc) =>
                doc.name &&
                doc.category &&
                doc.description &&
                doc.short_description &&
                doc.image &&
                doc.answer?.place_name &&
                doc.answer?.coordinates?.type &&
                doc.answer?.coordinates?.value
            )
            .map((doc) => ({
                name: doc.name,
                category: doc.category,
                description: doc.description,
                short_description: doc.short_description,
                image: doc.image,
                answer: {
                    place_name: doc.answer.place_name,
                    coordinates: {
                        type: doc.answer.coordinates.type,
                        value: doc.answer.coordinates.value,
                    },
                },
            }));



        // Retourner les résultats
        return guessObjects;
    } catch (error) {
        console.error("Erreur lors de la récupération des célébrités :", error);
        throw new Error("Erreur lors de la récupération des célébrités.");
    } finally {
        // Fermer la connexion MongoDB
        await client.close();
    }
}

