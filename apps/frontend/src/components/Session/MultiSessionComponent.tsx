'use client';

import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/others/LoadingComponent';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiGame } from '@/hooks/useMultiGame';
import { useMultiSession } from '@/hooks/useMultiSession';
import { GameConfig } from '@cityborn/types';
import { Guess } from '@cityborn/types';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function MultiSessionPage() {

    const { user } = useAuth();
    const { sessionID } = useParams<{ sessionID: string }>();
    const [localPlayerID, setLocalPlayerID] = useState<string | undefined>(user ? user.username : undefined);
    const multiSession = useMultiSession(localPlayerID, sessionID);
    const multiGame = useMultiGame(localPlayerID);
    const hasJoinedSession = useRef(false);


    ////////////////
    // useEffects //
    ////////////////

    // Auto connect to session
    useEffect(() => {
        if (multiSession.session && localPlayerID && !multiSession.connected && !hasJoinedSession.current) {
            console.log(localPlayerID)
            console.log(multiSession.session);
            handleJoinSession(localPlayerID);
            hasJoinedSession.current = true;
        }
    }, [multiSession.session]);

    // Automatic reconnect
    useEffect(() => {
        const autoReconnect = async () => {
            try {
                if (localPlayerID && !multiSession.connected && multiSession.socket.connected) {
                    const { isInGame } = await multiSession.reconnect(localPlayerID);
                    if (isInGame) {
                        await multiGame.reconnect(localPlayerID);
                    }
                }
            } catch (error) {
                console.log(`Erreur lors de la reconnexion automatique: ${error}`);
            }
        }
        autoReconnect();
    }, [multiSession.connected, multiSession.socket.connected]);


    //////////////////////////
    // Session interactions //
    //////////////////////////

    const handleJoinSession = async (playerID: string) => {
        try {
            await multiSession.join(playerID);
            setLocalPlayerID(playerID);
        } catch (error) {
            console.log(`Echec de la connexion à la session: ${error}`);
        }
    };

    const handleUpdateHost = async (newHostID: string) => {
        try {
            if (!localPlayerID) throw new Error('Nom du joueur non défini');
            await multiSession.updateHost(newHostID)
        } catch (error) {
            console.log(`Echec lors de la mise à jour du host: ${error}`);
        }
    }

    const handleUpdateGameConfig = async (gameConfig: Partial<GameConfig>) => {
        try {
            if (!localPlayerID) throw new Error('Nom du joueur non défini');
            await multiSession.updateGameConfig(gameConfig);
        } catch (error) {
            console.log(`Echec lors de la mise à jour de la configuration de la partie: ${error}`);
        }
    }

    const handleKickPlayer = async (playerToKick: string) => {
        try {
            if (!localPlayerID) throw new Error('Nom du joueur non défini');
            await multiSession.kickPlayer(playerToKick);
        } catch (error) {
            console.log(`Echec lors de la suppression du joueur de la session: ${error}`);
        }
    }

    const handleStartGame = async () => {
        try {
            if (!localPlayerID) throw new Error('Nom du joueur non défini');
            await multiSession.startGame();
        } catch (error) {
            console.log(`Echec lors du démarrage de la partie: ${error}`);
        }
    }

    // const handleReconnectToSession = async () => {
    //     try {
    //         if (!localPlayerID) throw new Error('Nom du joueur non défini');
    //         const isInGame = await multiSession.reconnect(localPlayerID);
    //         if (isInGame) await multiGame.reconnect(localPlayerID);
    //     } catch (error) {
    //         console.log(`Erreur lors de la reconnexion à la session: ${error}`);
    //     }
    // };


    ///////////////////////
    // Game interactions //
    ///////////////////////

    const handleGuess = async (guess: Guess) => {
        try {
            if (!localPlayerID) throw new Error('Nom du joueur non défini');
            await multiGame.guess(guess);
        } catch (error) {
            console.log(`Echec lors de l'enregistrement du guess: ${error}`);
        }
    }

    const handleNextRound = async () => {
        try {
            if (!localPlayerID) throw new Error('Nom du joueur non défini');
            await multiGame.nextRound();
        } catch (error) {
            console.log(`Echec lors du passage au round suivant: ${error}`);
        }
    }

    const handleEnd = async () => {
        try {
            if (!localPlayerID) throw new Error('Nom du joueur non défini');
            await multiSession.endGame();
            await multiGame.end();
        } catch (error) {
            console.log(`Echec lors de la finalisation de la partie: ${error}`);
        }
    }

    // const handleReconnectToGame = async () => {
    //     try {
    //         if (!localPlayerID) throw new Error('Nom du joueur non défini');
    //         await multiGame.reconnect(localPlayerID);
    //     } catch (error) {
    //         console.log(`Erreur lors de la reconnexion à la partie`);
    //     }
    // };


    ///////////////
    // Rendering //
    ///////////////

    // si pas de session, chargement
    if (!multiSession.session) return <LoadingComponent message='Chargement de la session' />

    // si pas de localPlayerID, afficher dialog
    // if (!localPlayerID) {
    //     return (
    //         <div className="flex flex-row justify-center items-center mt-16">
    //             <DialogInput message='Entrez votre pseudo' handleClick={handleJoinSession} label='Votre pseudo' />
    //         </div>
    //     );
    // }

    // Si game, display game
    if (multiGame.game) {
        return <GameComponent
            localPlayerID={localPlayerID}
            isHost={multiGame.isHost}
            game={multiGame.game}
            handleGuess={handleGuess}
            handleNextRound={handleNextRound}
            handleEnd={handleEnd}
            handlePlayAgain={handleStartGame} />
    } else {
        // display lobby
        return <LobbyComponent
            localPlayerID={localPlayerID}
            isHost={multiSession.isHost}
            session={multiSession.session}
            handleUpdateHost={handleUpdateHost}
            handleUpdateGameConfig={handleUpdateGameConfig}
            handleKickPlayer={handleKickPlayer}
            handleStartGame={handleStartGame}
            handleJoinSession={handleJoinSession}/>
    }

}