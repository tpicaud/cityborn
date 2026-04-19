import { client } from '../dbConnect';
import { Sentence, sentenceCollection } from '../models/sentence';

export async function addSentences(sentences: Sentence[]) {
  try {
    const db = client.db('sentencesDB');
    const collection = db.collection(sentenceCollection);

    // Préparer les opérations en lot
    const bulkOperations = sentences.map((sentence) => ({
      insertOne: {
        document: sentence,
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
        rejectedSentences: [], // Aucun rejeté s'il n'y a pas eu d'erreurs
      };
    } catch (error: any) {
      if (error.code === 11000) {
        console.warn('Des doublons ont été détectés.');

        // Identifier les sentences rejetées à cause de doublons
        const duplicateSentences = sentences
          .filter((sentence) =>
            error.writeErrors.some(
              (writeError: any) =>
                writeError.err.op.sentence === sentence.sentence,
            ),
          )
          .map((s) => s.sentence);

        console.log(
          "Les sentences suivantes n'ont pas pu être ajoutées en raison de doublons :",
          duplicateSentences,
        );

        return {
          insertedCount: error.result?.nInserted || 0,
          rejectedSentences: duplicateSentences,
        };
      } else {
        throw error; // Relance les erreurs imprévues
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout des sentences :", error);
    throw error;
  } finally {
    await client.close();
    console.log('Connexion MongoDB fermée.');
  }
}
