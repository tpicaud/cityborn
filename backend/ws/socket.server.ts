// src/ws/socket.server.ts
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { SessionStore } from "../stores/sessionStore.ts";
import { GameStore } from "../stores/gameStore.ts";
import { GameService } from "../services/gameService.ts";
import { SessionService } from "../services/sessionService.ts";
import { SessionHandler } from "../handlers/session.handler.ts";
import { GameHandler } from "../handlers/game.handler.ts";
import { PlayerService } from "../services/playerService.ts";
import { PlayerStore } from "../stores/socketStore.ts";

export function setupWebSocketServer(httpServer: any) {

    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            methods: ['GET', 'POST'],
        }
    });

    // Redis adapter
    const redis: Redis = new Redis(process.env.UPSTASH_REDIS_URL!);
    const pubClient = redis;
    const subClient = redis.duplicate();
    io.adapter(createAdapter(pubClient, subClient));

    // Stores
    const socketStore = new PlayerStore(redis);
    const sessionStore = new SessionStore(redis);
    const gameStore = new GameStore(redis);

    // Services
    const socketService = new PlayerService(socketStore);
    const gameService = new GameService(gameStore);
    const sessionService = new SessionService(sessionStore, socketService, gameService);

    // Handlers
    const sessionHandler = new SessionHandler(sessionService);
    const gameHandler = new GameHandler(gameService);

    io.on('connection', (socket) => {
        console.log('socket connected: ', socket.id);

        // Setup WebSocket handlers
        sessionHandler.register(socket, io);
        gameHandler.register(socket, io);
    });
}
