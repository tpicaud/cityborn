import { MongoClient } from 'mongodb';

// Configuration de la connexion MongoDB
const uri = process.env.NEXT_PUBLIC_MONGODB_URI || '';

// Connexion persistante
let dbClient: MongoClient | null = null;

// Fonction pour établir la connexion
export async function connectToDatabase() {
  if (!dbClient) {
    dbClient = new MongoClient(uri);
    await dbClient.connect();
  }
  return dbClient;
}
