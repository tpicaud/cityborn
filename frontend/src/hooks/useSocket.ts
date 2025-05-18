import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    // Connexion socket à l'initialisation
    useEffect(() => {
        const socket = io(SOCKET_URL, {
            transports: ["websocket"],
            autoConnect: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            setConnected(true);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
            setConnected(false);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    // Méthodes propres pour émettre / écouter
    const emit = useCallback(
        (event: string, ...args: any[]) => {
            const lastArg = args[args.length - 1];
            const hasCallback = typeof lastArg === 'function';

            if (hasCallback) {
                const callback = args.pop(); // Retire le callback de la liste des args
                socketRef.current?.emit(event, ...args, callback);
            } else {
                socketRef.current?.emit(event, ...args);
            }
        },
        []
    );


    const on = useCallback((event: string, callback: (...args: any[]) => void) => {
        socketRef.current?.on(event, callback);
    }, []);

    const off = useCallback((event: string, callback: (...args: any[]) => void) => {
        socketRef.current?.off(event, callback);
    }, []);

    return {
        connected,
        emit,
        on,
        off,
        socket: socketRef.current,
    };
};
