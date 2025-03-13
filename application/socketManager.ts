import { Server } from "socket.io";

let io: Server;

export function setIoInstance(ioInstance: Server) {
  io = ioInstance;
}

export function getIoInstance() {
  if (!io) {
    throw new Error("L'instance de Socket.IO n'est pas définie !");
  }
  return io;
}
