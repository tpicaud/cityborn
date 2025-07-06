import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { SessionStore } from "../stores/sessionStore.js";
import { GameStore } from "../stores/gameStore.js";
import { GameService } from "../services/gameService.js";
import { SessionService } from "../services/sessionService.js";
import { SessionHandler } from "../handlers/session.handler.js";
import { GameHandler } from "../handlers/game.handler.js";
import { PlayerService } from "../services/playerService.js";
import { PlayerStore } from "../stores/playerStore.js";
import { LockService } from "../services/lockService.js";

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
    const lockService = new LockService(redis);
    const playerService = new PlayerService(socketStore);
    const gameService = new GameService(gameStore, playerService, lockService);
    const sessionService = new SessionService(sessionStore, playerService, gameService, lockService);

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
