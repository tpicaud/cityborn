import { useEffect, useState } from "react";

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => console.log("Connecté au WebSocket");
    ws.onmessage = (event) => {
      console.log("Message reçu :", event.data);
      setMessages((prev) => [...prev, event.data]);
    };
    ws.onclose = () => console.log("Déconnecté du WebSocket");

    setSocket(ws);

    return () => ws.close();
  }, [url]);

  const sendMessage = (message: string) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  };

  return { messages, sendMessage };
}
