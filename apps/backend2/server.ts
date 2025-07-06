import http from "http";
import express from "express";
import dotenv from "dotenv";
import { setupWebSocketServer } from "./ws/socket.server.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

setupWebSocketServer(server);

server.listen(3001, () => {
    console.log('Serveur en écoute sur le port 3001');
});