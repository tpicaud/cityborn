export class PlayerService {
    private playerSockets = new Map();

    async connect(playerID: string, socketID:string) {
        throw new Error("Not implemented");
    }

    async reconnect(playerID: string, sessionID: string, socketID: string) {
        throw new Error("Not implemented");
    }

    async disconnect(playerID: string) {
        throw new Error("Not implemented");
    }

}