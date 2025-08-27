'use client';

import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/others/LoadingComponent';
import { useSoloGame } from '@/hooks/useSoloGame';
import { useSoloSession } from '@/hooks/useSoloSession';
import { GameConfig, Guess } from '@cityborn/types';
import { useAuth } from '@/contexts/AuthContext';

export default function SoloSessionComponent() {

    const { user } = useAuth();
    const localPlayerID = user ? user.username : 'guest';
    const soloGame = useSoloGame(localPlayerID);
    const soloSession = useSoloSession(soloGame.startGame, localPlayerID);

    //////////////////////////
    // Session interactions //
    //////////////////////////

    const handleJoinSession = (playerId: string) => { }

    const handleUpdateGameConfig = async (gameConfig: Partial<GameConfig>) => {
        try {
            if (!localPlayerID) throw new Error('Nom du joueur non défini');
            await soloSession.updateGameConfig(gameConfig);
        } catch (error) {
            console.log(`Echec lors de la mise à jour de la configuration de la partie: ${error}`);
        }
    }

    const handleStartGame = async () => {
        try {
            if (!localPlayerID) throw new Error('Nom du joueur non défini');
            await soloSession.startGame();
        } catch (error) {
            console.log(`Echec lors du démarrage de la partie: ${error}`);
        }
    }

    ///////////////////////
    // Game interactions //
    ///////////////////////

    const handleGuess = async (guess: Guess) => {
        try {
            if (!localPlayerID) throw new Error('Nom du joueur non défini');
            await soloGame.guess(guess);
        } catch (error) {
            console.log(`Echec lors de l'enregistrement du guess: ${error}`);
        }
    }

    const handleNextRound = async () => {
        try {
            if (!localPlayerID) throw new Error('Nom du joueur non défini');
            await soloGame.nextRound();
        } catch (error) {
            console.log(`Echec lors du passage au round suivant: ${error}`);
        }
    }

    const handleEnd = async () => {
        try {
            if (!localPlayerID) throw new Error('Nom du joueur non défini');
            await soloSession.endGame();
            await soloGame.end();
        } catch (error) {
            console.log(`Echec lors de la finalisation de la partie: ${error}`);
        }
    }


    ///////////////
    // Rendering //
    ///////////////

    // si pas de session, chargement
    if (!soloSession.session) return <LoadingComponent message='Chargement de la session' />

    // Si game, display game
    if (soloGame.game) {
        return <GameComponent
            localPlayerID={localPlayerID}
            isHost={soloGame.isHost}
            game={soloGame.game}
            handleGuess={handleGuess}
            handleNextRound={handleNextRound}
            handleEnd={handleEnd}
            handlePlayAgain={handleStartGame} />
    } else {
        // display lobby
        return <LobbyComponent
            localPlayerID={localPlayerID}
            isHost={soloSession.isHost}
            session={soloSession.session}
            handleUpdateGameConfig={handleUpdateGameConfig}
            handleStartGame={handleStartGame}
            handleJoinSession={handleJoinSession}
        />
    }
}