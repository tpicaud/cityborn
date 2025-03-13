import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { getIoInstance, setIoInstance } from "./socketManager.ts";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  setIoInstance(io)

  io.on("connection", (socket) => {
    // Envoie un message de confirmation dès que le client se connecte
    console.log("Un client est connecté avec l'ID :", socket.id);
    socket.emit("message", "Bienvenue, vous êtes bien connecté!");

    // Gère la réception des messages envoyés par le client
    socket.on("message", (data) => {
      console.log("Message reçu de", socket.id, ":", data);

      // Vous pouvez envoyer un message en réponse au client
      socket.emit("message", `Message reçu : ${data}`);
    });

    // Événement qui se déclenche lorsque la connexion est fermée
    socket.on("disconnect", () => {
      console.log("Le client", socket.id, "a quitté.");
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(3000, () => {
      console.log(`> Ready`);
    });
});

export function sendMessage(
  message: string
) {
  const io = getIoInstance()
  io.emit(message)
}