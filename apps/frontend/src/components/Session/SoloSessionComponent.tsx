'use client';

import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/others/LoadingComponent';
import { useSoloSession } from '@/hooks/useSoloSession';
import { GameConfig, Guess } from '@cityborn/types';
import { useAuth } from '@/contexts/AuthContext';
import { useError } from '@/contexts/ErrorContext';

export default function SoloSessionComponent() {

    const { user } = useAuth();
    const { invokeError } = useError();
    const localPlayerID = user ? user.username : 'guest';
    const soloSession = useSoloSession(localPlayerID);

    //////////////////////////
    // Session interactions //
    //////////////////////////

    const handleJoinSession = () => { }

    const handleUpdateGameConfig = async (gameConfig: Partial<GameConfig>) => {
        try {
            await soloSession.updateGameConfig(gameConfig);
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handleStartGame = async () => {
        try {
            await soloSession.startGame();
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handleEndGame = async () => {
        try {
            await soloSession.endGame();
        } catch (error: any) {
            invokeError(error);
        }
    }

    ///////////////////////
    // Game interactions //
    ///////////////////////

    const handleGuess = async (guess: Guess) => {
        try {
            await soloSession.guess(guess);
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handleNextRound = async () => {
        try {
            await soloSession.nextRound();
        } catch (error: any) {
            invokeError(error);
        }
    }


    ///////////////
    // Rendering //
    ///////////////

    // si pas de session, chargement
    if (!soloSession.session) return <LoadingComponent message='Chargement de la session' />

    // Si game, display game
    if (soloSession.session.currentGame) {
        return <GameComponent
            localPlayerID={localPlayerID}
            isHost={soloSession.isHost}
            game={soloSession.session.currentGame}
            handleGuess={handleGuess}
            handleNextRound={handleNextRound}
            handleEndGame={handleEndGame}
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