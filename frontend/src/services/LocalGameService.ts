import GuessObject from "@/types/GuessObject";

const getLocalObjectList = async (category: string): Promise<GuessObject[]> => {
    const objects: GuessObject[] = [];
    console.log(category)

    try {
        const response = await fetch(`/api/guess-objects?category=${encodeURIComponent(category)}`);
        const data = await response.json();

        if (Array.isArray(data)) {
            objects.push(...data);
        }

    } catch (error) {
        console.error('Erreur lors de la récupération des données dans la base de donnée: ', error);
    }

    return objects;
};

const getEndSentence = async (score_type: string): Promise<string> => {
    try {
        const response = await fetch(`/api/sentence?score_type=${encodeURIComponent(score_type)}`);
        const data = await response.json();
        
        return data.sentence;
    } catch (error) {
        console.error('Erreur lors de la récupération de la phrase: ', error);
    }
    return '';
}

export { getLocalObjectList, getEndSentence };
