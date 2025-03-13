import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<string[]>([]); // État pour stocker les messages reçus

  useEffect(() => {
    const socketInstance = io('http://localhost:3000');
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('connecté')
    })

    // Reçoit un message du serveur
    socketInstance.on("message", (data) => {
      console.log("Message du serveur:", data);
    });

    // Envoie un message au serveur
    socketInstance.emit("message", "Hello, serveur!");

    socketInstance.on('messageFromServer', (message: string) => {
      console.log('Message reçu du serveur:', message);
      setMessages((prevMessages) => [...prevMessages, message]); // Ajout du message à la liste
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendMessage = (message: string) => {
    if (socket) {
      socket.emit('message', message);
    }
  };

  return { messages, sendMessage };
};

export default useSocket;
