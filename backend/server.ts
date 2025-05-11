import { Server as SocketIOServer } from "socket.io";
import { GameService } from "./services/gameService.ts";
import { createAdapter } from "@socket.io/redis-adapter";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import Redis from "ioredis";
import { setupSessionSocket } from "./sockets/sessionSocket.ts";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Créer une instance de Socket.IO et l'attacher au serveur HTTP
export const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        methods: ['GET', 'POST'],
    }
});

// Redis instance
export const redis = new Redis(process.env.UPSTASH_REDIS_URL!);
const pubClient = redis
const subClient = redis.duplicate();

io.adapter(createAdapter(pubClient, subClient));

setupSessionSocket(io);

server.listen(3001, () => {
    console.log('Serveur en écoute sur le port 3001');
});