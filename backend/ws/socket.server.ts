// src/ws/socket.server.ts
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { setupWSHandler } from "../handlers/wsHandler.ts";
import { SessionStore } from "../stores/sessionStore.ts";
import { GameStore } from "../stores/gameStore.ts";
import { SocketStore } from "../stores/socketStore.ts";
import { GameService } from "../services/gameService.ts";
import { SessionService } from "../services/sessionService.ts";
import { SocketService } from "../services/socketService.ts";
import { SessionHandler } from "../handlers/session.handler.ts";
import { GameHandler } from "../handlers/game.handler.ts";

export function setupWebSocketServer(httpServer: any) {

    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            methods: ['GET', 'POST'],
        }
    });

    // Redis adapter
    const redis = new Redis(process.env.UPSTASH_REDIS_URL!);
    const pubClient = redis;
    const subClient = redis.duplicate();
    io.adapter(createAdapter(pubClient, subClient));

    // Stores
    const socketStore = new SocketStore();
    const sessionStore = new SessionStore();
    const gameStore = new GameStore();

    // Services
    const socketService = new SocketService(socketStore);
    const gameService = new GameService(gameStore);
    const sessionService = new SessionService(sessionStore, gameService);

    // Handlers
    const sessionHandler = new SessionHandler(socketService, sessionService);
    const gameHandler = new GameHandler(gameService);

    io.on('connection', (socket) => {
        console.log('socket connected: ', socket.id);

        // Setup WebSocket handlers
        sessionHandler.register(socket, io);
    });
}
