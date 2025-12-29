import { GuessObject } from '@cityborn/types';

const getLocalObjectList = async (category: string): Promise<GuessObject[]> => {
  const objects: GuessObject[] = [];
  console.log(category);

  try {
    const response = await fetch(
      `/api/guess-objects?category=${encodeURIComponent(category)}`,
    );
    const data = await response.json();

    if (Array.isArray(data)) {
      objects.push(...data);
    }
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des données dans la base de donnée: ',
      error,
    );
  }

  return objects;
};

export { getLocalObjectList };
