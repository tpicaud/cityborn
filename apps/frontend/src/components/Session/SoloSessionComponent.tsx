'use client';

import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/others/LoadingComponent';
import { useSoloSession } from '@/hooks/useSoloSession';
import { GameConfig, Guess } from '@cityborn/types';
import { useAuth } from '@/contexts/AuthContext';
import { useError } from '@/contexts/ErrorContext';
import { useRouter } from 'next/navigation';

export default function SoloSessionComponent() {

    const router = useRouter();
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
            soloSession.updateGameConfig(gameConfig);
        } catch (error: any) {
            invokeError(error);
        }
    }

    ///////////////////////
    // Game interactions //
    ///////////////////////

    const handleStartGame = async () => {
        try {
            soloSession.startGame();
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handleGuess = async (guess: Guess) => {
        try {
            soloSession.guess(guess);
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handleNextRound = async () => {
        try {
            soloSession.nextRound();
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handleEndGame = async () => {
        try {
            soloSession.endGame();
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handlePlayAgain = async () => {
        try {
            soloSession.playAgain();
        } catch (error) {
            console.log(error);
        }
    }

    const handleExitGame = async () => {
        router.push('/')
        return;
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
            session={soloSession.session}
            game={soloSession.session.currentGame}
            handleGuess={handleGuess}
            handleNextRound={handleNextRound}
            handleEndGame={handleEndGame}
            handlePlayAgain={handlePlayAgain}
            handleExitGame={handleExitGame} />
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