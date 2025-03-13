import Game from "@/types/Game";
import { PlayerResults } from "@/types/Results";

export const getGameResult = (game: Game, localPlayerID: string): PlayerResults | null => {
    console.log(localPlayerID)
    console.log(game.players)
    const player = game.players.find((p) => p.id === localPlayerID);
    return player ? { results: player.results } : null;
};