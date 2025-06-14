import { client } from "./database/dbConnect";
import { sentenceCollection } from "./database/models/sentence";

export async function initSentencesDB() {
    try {
        console.log("Initiating database...");
        const db = client.db("sentencesDB");
        const collection = db.collection(sentenceCollection);

        // Création de l'index unique sur le champ 'name'
        await collection.createIndex({ sentence: 1 }, { unique: true });
        console.log("Database initiated successfully.");
    } catch (error) {
        console.error("Error while initiating database", error);
        throw error;
    } finally {
        client.close();
    }
}

initSentencesDB();