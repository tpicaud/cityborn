import GuessObject from "@/types/GuessObject";

const getLocalObjectList = async (): Promise<GuessObject[]> => {
    const objectsCSV: CSVObject[] = [];

    try {
        const response = await fetch('http://localhost:3000/api/read-csv');
        const data = await response.json();

        data.forEach((element: CSVObject) => {
            objectsCSV.push({
                name: element.name,
                category: element.category,
                nationality: element.nationality
            });
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
    }
    return [];
};

interface CSVObject {
    name: string;
    category: string;
    nationality: string;
}

export { getLocalObjectList };
