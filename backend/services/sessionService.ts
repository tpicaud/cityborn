import { SessionStore } from "../stores/sessionStore";
import { GameService } from "./gameService";
import { PlayerService } from "./playerService";

export class SessionService {
    private sessionStore: SessionStore;
    private playerService: PlayerService;
    private gameService: GameService;

    constructor(sessionStore: SessionStore, playerService: PlayerService, gameService: GameService) {
        this.sessionStore = sessionStore;
        this.playerService = playerService
        this.gameService = gameService;
    }

    async join(socketID: string, sessionID: string, playerID: string) {
        try {
            // Récupération de la session
            const session: any | undefined = await this.sessionStore.getSession(sessionID);
            if (!session) throw new Error("Session introuvable.");

            // Check si l'id du joueur est déjà dans la session
            const playerExists = session.players.some((player: any) => player.id === playerID);
            if (playerExists) throw new Error("Le joueur est déjà dans la session.");

            // Register player socket
            await this.playerService.register(socketID, playerID, sessionID);

            // Créer un nouveau joueur
            const newPlayer: any = { id: playerID, sessionID: sessionID, connected: true };
            if (session.players.length === 0) session.hostID = playerID;
            session.players.push(newPlayer);

            // Set host si necéssaire
            if (session.hostID === '') session.hostID = playerID;

            // Save session
            await this.sessionStore.saveSession(session);
            return session;
        } catch (error) {
            throw new Error(`Erreur lors de la connexion de ${playerID} à la session ${sessionID}: ${error}`);
        }
    }

    async updateHost(socketID: string, newHostID: string) {
        try {
            // Récupération du joueur
            const { playerID, sessionID } = await this.playerService.getPlayer(socketID);
            if (!playerID || !sessionID) throw new Error(`Aucun joueur associé au socket ${socketID}`);

            // Récupération du jeu dans la base de données
            const session: any | undefined = await this.sessionStore.getSession(sessionID)
            if (!session) throw new Error("Session introuvable.");

            // Check si la session n'est pas déjà en game
            if (session.status === "IN_GAME") throw new Error("La session est déjà en jeu");

            // Check si le joueur est le host
            if (session.hostID !== playerID) throw new Error(`Le joueur n'est pas le host de la session`);

            // Check si le nouveau host est dans la session
            const newHost = session.players.find((player: any) => player.id === newHostID && player.connected);
            if (!newHost) throw new Error(`Le joueur ${newHostID} n'est pas dans la session`);

            // Update gameConfig
            session.hostID = newHost.id;

            await this.sessionStore.saveSession(session);
            return session;
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour du host de la session: ${error}`);
        }
    }

    async updateGameConfig(socketID: string, gameConfig: any) {
        try {
            // Récupération du joueur
            const { playerID, sessionID } = await this.playerService.getPlayer(socketID);
            if (!playerID || !sessionID) throw new Error(`Aucun joueur associé au socket ${socketID}`);

            // Récupération du jeu dans la base de données
            const session: any | undefined = await this.sessionStore.getSession(sessionID)
            if (!session) throw new Error("Session introuvable.");

            // Check si le joueur est le host
            if (session.hostID !== playerID) throw new Error(`Le joueur n'est pas le host de la session`);

            // Update gameConfig
            session.gamecConfig = gameConfig;

            await this.sessionStore.saveSession(session);
            return session;
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour de la configuration de la partie: ${error}`);
        }
    }

    async startGame(socketID: string) {
        try {
            // Récupération du joueur
            const { playerID, sessionID } = await this.playerService.getPlayer(socketID);
            if (!playerID || !sessionID) throw new Error(`Aucun joueur associé au socket ${socketID}`);

            // Récupération du jeu dans la base de données
            const session: any | undefined = await this.sessionStore.getSession(sessionID)
            if (!session) throw new Error("Session introuvable.");

            // Check si le joueur est le host
            if (session.hostID !== playerID) throw new Error(`Le joueur n'est pas le host de la session`);

            // Créer une nouvelle partie
            const game = await this.gameService.createGameFromSession(session);



            // Update session
            session.status = "IN_GAME";

            await this.sessionStore.saveSession(session);
            return { session, gameID: game.id };
        } catch (error) {
            throw new Error(`Erreur lors du démarrage de la partie: ${error}`);
        }
    }

    async reconnectPlayer(socketID: string, sessionID: string, playerID: string) {
        try {
            // Récupération du jeu dans la base de données
            const session: any | undefined = await this.sessionStore.getSession(sessionID)
            if (!session) throw new Error("Session introuvable.");

            // Check si l'id du joueur est dans la session
            const playerIndex = session.players.findIndex((player: any) => player.id === playerID);
            if (playerIndex === -1) throw new Error(`Le joueur ${playerID} n'est pas dans la session`);

            // Register new player socket
            await this.playerService.register(socketID, playerID, sessionID);

            // Reconnexion du joueur
            session.players[playerIndex].connected = true;

            // Check s'il est en game
            const isInGame = await this.isInGame(session, playerID);

            await this.sessionStore.saveSession(session);
            return { session, isInGame }
        } catch (error) {
            throw new Error(`Erreur lors de la reconnexion de ${playerID}`);
        }
    }


    ///////////////////
    // Game updates //
    ///////////////////
    async disconnectPlayer(socketID: string) {
        try {
            // Récupération du joueur
            const { playerID, sessionID } = await this.playerService.getPlayer(socketID);
            if (!playerID || !sessionID) throw new Error(`Aucun joueur associé au socket ${socketID}`);

            // Récupération du jeu dans la base de données
            const session: any | undefined = await this.sessionStore.getSession(sessionID)
            if (!session) throw new Error("Session introuvable.");

            // Check si l'id du joueur est dans la partie
            const playerIndex = session.players.findIndex((player: any) => player.id === playerID);
            if (playerIndex === -1) throw new Error(`Le joueur ${playerID} n'est pas dans la session`);

            // Déconnexion du joueur
            session.players[playerIndex].connected = false;

            // Update host
            const isHost = playerID === session.hostID
            if (isHost) {
                const connectedPlayers = session.players.filter((player: any) => session.status === 'IN_GAME' ? player.connected && player.inGame : player.connected);
                if (connectedPlayers.length > 0) {
                    session.hostID = connectedPlayers[0].id;
                } else {
                    session.hostID = '';
                }
            }

            // Notifier la game
            let game = undefined
            if (await this.isInGame(session.currentGameId, playerID)) {
                game = session.currentGameId ? await this.gameService.disconnectPlayer(socketID, isHost ? session.hostID : undefined) : undefined;
            }

            // Update states
            await this.playerService.deletePlayer(socketID);
            await this.sessionStore.saveSession(session);

            return { session, game };
        } catch (error) {
            throw new Error(`Erreur lors de la déconnexion du socket ${socketID}`);
        }
    }



    // Private function
    private async isInGame(gameID: string, playerID: string) {
        const game = await this.gameService.getGame(gameID);
        return game.players.some(player => player.id === playerID);
    }

    // async getPlayerSocket(sessionID: string, playerID) {
    //     try {
    //         // Récupération du jeu dans la base de données
    //         const session: any | undefined = await this.sessionStore.getSession(sessionID)
    //         if (!session) throw new Error("Session introuvable.");

    //         // Check si l'id du joueur est dans la partie
    //         const playerIndex = session.players.findIndex((player: any) => player.id === playerID);
    //         if (playerIndex === -1) throw new Error(`Le joueur ${playerID} n'est pas dans la session`);

    //         return await this.playerService.getSocket(playerID, sessionID);
    //     } catch (error) {
    //         throw new Error(`Erreur lors de la récupération des soclkets de la session ${sessionID}`);
    //     }
    // }

    // async getAllSockets(sessionID: string) {
    //     try {
    //         // Récupération du jeu dans la base de données
    //         const session: any | undefined = await this.sessionStore.getSession(sessionID)
    //         if (!session) throw new Error("Session introuvable.");

    //         return session.players.map(async (player) => player.connected && await this.playerService.getSocket(player.id, sessionID));
    //     } catch (error) {
    //         throw new Error(`Erreur lors de la récupération des soclkets de la session ${sessionID}`);
    //     }
    // }
}