import { OnlinePlayer, Session } from "@cityborn/types";
import { SessionStore } from "../stores/sessionStore.js";
import { GameService } from "./gameService.js";
import { LockService } from "./lockService.js";
import { PlayerService } from "./playerService.js";

export class SessionService {
    private sessionStore: SessionStore;
    private playerService: PlayerService;
    private gameService: GameService;
    private lockService: LockService;
    private LOCK_TTL = 2000;

    constructor(sessionStore: SessionStore, playerService: PlayerService, gameService: GameService, lockService: LockService) {
        this.sessionStore = sessionStore;
        this.playerService = playerService
        this.gameService = gameService;
        this.lockService = lockService;
    }

    async join(socketID: string, sessionID: string, playerID: string) {
        try {
            return await this.lockService.withLock(this.sessionStore.key(sessionID), this.LOCK_TTL, async () => {

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
            });
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
            session.gameConfig = gameConfig;

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
            session.currentGameId = game.id;

            await this.sessionStore.saveSession(session);
            return { session, gameID: game.id };
        } catch (error) {
            throw new Error(`Erreur lors du démarrage de la partie: ${error.message}`);
        }
    }

    async endGame(socketID: string) {
                try {
            // Récupération du joueur
            const { playerID, sessionID } = await this.playerService.getPlayer(socketID);
            if (!playerID || !sessionID) throw new Error(`Aucun joueur associé au socket ${socketID}`);

            // Récupération du jeu dans la base de données
            const session: any | undefined = await this.sessionStore.getSession(sessionID)
            if (!session) throw new Error("Session introuvable.");

            // Check si le joueur est le host
            if (session.hostID !== playerID) throw new Error(`Le joueur n'est pas le host de la session`);

            //Check si la partie est terminée
            const game = await this.gameService.getGame(session.currentGameId);
            if (!game) throw new Error("Aucune partie en cours.");

            // Update session
            session.status = 'IN_LOBBY';
            session.currentGameId = undefined

            await this.sessionStore.saveSession(session);
            return session;
        } catch (error) {
            throw new Error(`Erreur lors de la fin de partie: ${error.message}`);
        }
    }

    async reconnectPlayer(socketID: string, sessionID: string, playerID: string) {
        try {
            return await this.lockService.withLock(this.sessionStore.key(sessionID), this.LOCK_TTL, async () => {

                // Récupération du jeu dans la base de données
                const session: Session | undefined = await this.sessionStore.getSession(sessionID);
                if (!session) throw new Error("Session introuvable.");

                // Get players
                const players = session.players as OnlinePlayer[];

                // Check si l'id du joueur est dans la session
                const playerIndex = players.findIndex((player: any) => player.id === playerID);
                if (playerIndex === -1) throw new Error(`Le joueur ${playerID} n'est pas dans la session`);

                // Register new player socket
                await this.playerService.register(socketID, playerID, sessionID);

                // Reconnexion du joueur
                players[playerIndex].connected = true;

                // Check host
                if (session.hostID === '') session.hostID = playerID;

                // Check s'il est en game
                const isInGame = session.currentGameId ? await this.isInGame(session.currentGameId, playerID): false;

                await this.sessionStore.saveSession(session);
                return { session, isInGame };
            });
        } catch (error) {
            throw new Error(`Erreur lors de la reconnexion de ${playerID}: ${error}`);
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

            return await this.lockService.withLock(this.sessionStore.key(sessionID), this.LOCK_TTL, async () => {

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
                    const currentGame = session.currentGameId ? await this.gameService.getGame(session.currentGameId) : null;
                    const players = currentGame ? currentGame.players : session.players;

                    const connectedPlayers = players.filter((player: any) => player.connected && player.id !== playerID);
                    if (connectedPlayers.length > 0) {
                        session.hostID = connectedPlayers[0].id;
                    } else {
                        session.hostID = '';
                    }
                }

                // Notifier la game
                let game = undefined
                if (session.currentGameId && await this.isInGame(session.currentGameId, playerID)) {
                    game = session.currentGameId ? await this.gameService.disconnectPlayer(socketID, isHost ? session.hostID : undefined) : undefined;
                    if (game && game.status === 'FINISHED') {
                        session.status = 'IN_LOBBY';
                        session.currentGameId = undefined;
                    }
                }

                // Update states
                await this.playerService.deletePlayer(socketID);
                await this.sessionStore.saveSession(session);

                return { session, game };
            });
        } catch (error) {
            throw new Error(error.message);
        }
    }


    // Private function
    private async isInGame(gameID: string, playerID: string) {
        const game = await this.gameService.getGame(gameID);
        return game.players.some(player => player.id === playerID);
    }
}