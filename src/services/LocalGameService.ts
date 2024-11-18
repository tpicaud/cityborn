import GuessObject from "@/types/GuessObject";

const getLocalObjectList = async (): Promise<GuessObject[]> => {
    const objects: GuessObject[] = [];

    try {
        const {signal} = new AbortController();
        const response = await fetch('/api/guess-objects', { signal });
        const data = await response.json();

        console.log('Données récupérées:', data);

        if (Array.isArray(data)) {
            objects.push(...data);
        }

    } catch (error) {
        console.error('Erreur lors de la récupération des données dans la base de donnée:', error);
    }

    return objects;
};

export { getLocalObjectList };
