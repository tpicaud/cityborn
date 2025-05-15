import { SocketStore } from "../stores/socketStore";

export class SocketService {

    private socketStore: SocketStore;

    constructor(socketStore: SocketStore) {
        this.socketStore = socketStore;
    }

    async setSocket(socketID: string, playerID: string, sessionID: string) {
        try {
            await this.socketStore.set(socketID, playerID, sessionID);
        } catch (error) {
            throw new Error (`Erreur lors de l'enregistrement du socket du joueur ${playerID}`);
        }
    }

    async getSocket(playerID: string, sessionID: string) {
        
    }
    // async connect(playerID: string, socketID: string) {
    //     throw new Error("Not implemented");
    // }

    // async reconnect(sockerID: string, playerID: string, sessionID: string, socketID: string) {
    //     throw new Error("Not implemented");
    // }

    // async disconnect(playerID: string) {
    //     throw new Error("Not implemented");
    // }

}