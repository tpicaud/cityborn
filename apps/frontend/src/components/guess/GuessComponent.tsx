'use client';

import type { Game, Guess, Session } from '@cityborn/api';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  type MapProps,
} from '@cityborn/client/game';
import { useGuessRound } from '@cityborn/client/game/react';
import dynamic from 'next/dynamic';
import OverlayComponent from '@/components/guess/OverlayComponent';
import RoundCountdownComponent from './RoundCountdown';

const GoogleMapComponent = dynamic(
  () => import('@/components/guess/maps/GoogleMapComponent'),
  { ssr: false },
);

interface GuessComponentProps {
  localPlayerID: string;
  session: Session;
  game: Game;
  handleGuess: (guess: Guess) => void;
  handleNextRound: () => void;
}

const GuessComponent: React.FC<GuessComponentProps> = ({
  localPlayerID,
  session,
  game,
  handleGuess,
  handleNextRound,
}) => {
  const {
    preGuess,
    phase,
    isOverlayVisible,
    handlePreGuess,
    handleIsTimeUp,
    handleCountdownEnd,
  } = useGuessRound(game.state.currentRound?.status, handleGuess);

  const googleMapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
  if (!googleMapApiKey) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAP_API_KEY is not set');
  }

  const mapProps: MapProps = {
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
    preGuess,
    localPlayerID,
    game,
    handlePreGuess,
  };

  return (
    <div>
      <div className="fixed w-full h-full z-0">
        <GoogleMapComponent API_KEY={googleMapApiKey} mapProps={mapProps} />
      </div>

      {phase === 'countdown' && (
        <RoundCountdownComponent onCountdownEnd={handleCountdownEnd} />
      )}

      {isOverlayVisible && (
        <div className="z-10">
          <OverlayComponent
            localPlayerID={localPlayerID}
            preGuess={preGuess}
            session={session}
            game={game}
            handleGuess={handleGuess}
            handleIsTimeUp={handleIsTimeUp}
            handleNextRound={handleNextRound}
          />
        </div>
      )}
    </div>
  );
};

export default GuessComponent;
