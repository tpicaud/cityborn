import { PlayerStore } from "../stores/playerStore.js";

export class PlayerService {

    private playerStore: PlayerStore;

    constructor(socketStore: PlayerStore) {
        this.playerStore = socketStore;
    }

    async register(socketID: string, playerID: string, sessionID: string, gameID?: string) {
        try {
            await this.playerStore.set(socketID, playerID, sessionID, gameID);
        } catch (error) {
            throw new Error(`Erreur lors de l'enregistrement du socket du socket ${socketID}`);
        }
    }

    async getPlayer(socketID: string) {
        try {
            return await this.playerStore.get(socketID);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du joueur associé au socket ${socketID}`);
        }
    }

    async deletePlayer(socketID: string) {
        try {
            await this.playerStore.delete(socketID);
        } catch (error) {
            throw new Error(`Erreur lors de la suppression du joueur associé au socket ${socketID}`);
        }
    }
}