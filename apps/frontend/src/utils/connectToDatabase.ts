import { MongoClient } from 'mongodb';

const uri = process.env.NEXT_PUBLIC_MONGODB_URI || '';

let dbClient: MongoClient | null = null;

export async function connectToDatabase() {
  if (!dbClient) {
    dbClient = new MongoClient(uri);
    await dbClient.connect();
  }
  return dbClient;
}
