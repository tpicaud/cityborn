import { getSocket } from "@/lib/socket";
import { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";

export const useSocket = () => {
    const socket: Socket = getSocket();
    const [connected, setConnected] = useState(false);

    // Connexion socket à l'initialisation
    useEffect(() => {

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            setConnected(true);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
            setConnected(false);
        });

        socket.on("error", (data) => {
            console.log(data.message);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Méthodes propres pour émettre / écouter
    const emit = useCallback(
        (event: string, ...args: any[]) => {
            const lastArg = args[args.length - 1];
            const hasCallback = typeof lastArg === 'function';

            if (hasCallback) {
                const callback = args.pop(); // Retire le callback de la liste des args
                socket.emit(event, ...args, callback);
            } else {
                socket.emit(event, ...args);
            }
        },
        []
    );


    const on = useCallback((event: string, callback: (...args: any[]) => void) => {
        socket.on(event, callback);
    }, []);

    const off = useCallback((event: string, callback: (...args: any[]) => void) => {
        socket.off(event, callback);
    }, []);

    return {
        connected,
        emit,
        on,
        off,
        socket,
    };
};
