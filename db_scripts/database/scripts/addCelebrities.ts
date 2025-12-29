import { client } from '../dbConnect';
import { celebrityCollection, GuessObject } from '../models/celebrity';

export async function addCelebrities(celebrities: GuessObject[]) {
  try {
    const db = client.db('celebritiesDB');
    const collection = db.collection(celebrityCollection);

    // Préparer les opérations en lot
    const bulkOperations = celebrities.map((celebrity) => ({
      insertOne: {
        document: celebrity,
      },
    }));

    try {
      // Exécuter les opérations en lot
      const result = await collection.bulkWrite(bulkOperations, {
        ordered: false,
      });

      console.log(
        'Opérations en lot terminées avec succès :',
        result.insertedCount,
      );
      return {
        insertedCount: result.insertedCount,
        rejectedCelebrities: [], // Aucun rejeté s'il n'y a pas eu d'erreurs
      };
    } catch (error: any) {
      if (error.code === 11000) {
        console.warn('Des doublons ont été détectés.');

        // Identifier les célébrités rejetées à cause de doublons
        const duplicateNames = celebrities
          .filter((celebrity) =>
            error.writeErrors.some(
              (writeError: any) => writeError.err.op.name === celebrity.name,
            ),
          )
          .map((c) => c.name);

        console.log(
          "Les célébrités suivantes n'ont pas pu être ajoutées en raison de doublons :",
          duplicateNames,
        );

        return {
          insertedCount: error.result?.nInserted || 0,
          rejectedCelebrities: duplicateNames,
        };
      } else {
        throw error; // Relance les erreurs imprévues
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout des célébrités :", error);
    throw error;
  } finally {
    await client.close();
    console.log('Connexion MongoDB fermée.');
  }
}
