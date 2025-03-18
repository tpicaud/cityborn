import Game from "@/types/Game";
import { PlayerResults } from "@/types/Results";

export const getGameResult = (game: Game): Map<string, PlayerResults> => {
    const resultsMap = new Map<string, PlayerResults>();

    game.players.forEach((player) => {
        resultsMap.set(player.id, { results: player.results });
    });

    return resultsMap;
};
