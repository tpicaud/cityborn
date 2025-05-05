import Game from "@/types/Game";
import { PlayerResults } from "@/types/Results";

export const getGameResult = (game: Game): Map<string, PlayerResults> => {
    const resultsMap = new Map<string, PlayerResults>();

    for (const [key, value] of Object.entries(game.results)) {
        resultsMap.set(key, value);
    }

    return resultsMap;
};
