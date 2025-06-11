import { getGame } from "./gamesStore.ts";

export function isGameEmpty(gameId: string) {
    const game = getGame(gameId)
    const connectedPlayers = game.players.filter((player: any) => player.connected);
    return connectedPlayers.length === 0
}