import { client } from "./database/dbConnect";
import { celebrityCollection } from "./database/models/celebrity";

export async function initCelebritiesDB() {
    try {
        console.log("Initiating database...");
        const db = client.db("celebritiesDB");
        const collection = db.collection(celebrityCollection);

        // Création de l'index unique sur le champ 'name'
        await collection.createIndex({ name: 1 }, { unique: true });
        console.log("Database initiated successfully.");
    } catch (error) {
        console.error("Error while initiating database", error);
        throw error;
    } finally {
        client.close();
    }
}

initCelebritiesDB();