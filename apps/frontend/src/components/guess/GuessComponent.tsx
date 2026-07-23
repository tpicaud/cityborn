'use client';

import {
  type Game,
  type Guess,
  RoundStatus,
  type Session,
} from '@cityborn/api';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import OverlayComponent from '@/components/guess/OverlayComponent';
import useGuess from '@/hooks/useGuess';
import RoundCountdownComponent from './RoundCountdown';

const GoogleMapComponent = dynamic(
  () => import('@/components/guess/maps/GoogleMapComponent'),
  { ssr: false },
);

const DEFAULT_MAP_CENTER = { lat: 48.8566, lng: 2.3522 };

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
  const { preGuess, resetPreGuess, handlePreGuess, handleIsTimeUp } =
    useGuess(handleGuess);
  const [internalRoundStatus, setInternalRoundStatus] = useState<
    'countdown' | 'guessing' | 'results'
  >('countdown');

  // Map properties
  const mapProps = {
    center: DEFAULT_MAP_CENTER,
    zoom: 2,
    preGuess,
    localPlayerID,
    game,
    handlePreGuess,
  };

  useEffect(() => {
    switch (game.state.currentRound?.status) {
      case RoundStatus.GUESSING:
        resetPreGuess();
        setInternalRoundStatus('countdown');
        break;

      case RoundStatus.SHOWING_RESULTS:
        setInternalRoundStatus('results');
        break;

      default:
        resetPreGuess();
        setInternalRoundStatus('countdown');
        break;
    }
  }, [game.state.currentRound?.status, resetPreGuess]);

  return (
    <div>
      <div className="fixed w-full h-full z-0">
        <GoogleMapComponent
          API_KEY={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}
          mapProps={mapProps}
        />
      </div>

      {internalRoundStatus === 'countdown' && (
        <RoundCountdownComponent
          onCountdownEnd={() => setInternalRoundStatus('guessing')}
        />
      )}

      {(internalRoundStatus === 'guessing' ||
        internalRoundStatus === 'results') &&
        !(
          internalRoundStatus === 'results' &&
          game.state.currentRound?.status === RoundStatus.GUESSING
        ) && (
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
