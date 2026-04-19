import { client } from '../dbConnect';
import { GuessObject, celebrityCollection } from '../models/celebrity';

export async function getCelebrities(
  category?: string,
): Promise<GuessObject[]> {
  try {
    const db = client.db();
    const collection = db.collection<GuessObject>(celebrityCollection);

    // Rechercher par catégorie si spécifiée, sinon tout récupérer
    const query = category ? { category } : {};
    const celebrities = await collection.find(query).toArray();

    console.log(`${celebrities.length} célébrité(s) trouvée(s).`);
    return celebrities;
  } catch (error) {
    console.error('Erreur lors de la récupération des célébrités :', error);
    throw error;
  }
}
