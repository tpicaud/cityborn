'use client';

import type { PlayerId, Session } from '@cityborn/api';
import { type GameComponentProps, useGameRound } from '@cityborn/client/game';
import dynamic from 'next/dynamic';
import OverlayComponent from '@/components/guess/OverlayComponent';
import RoundCountdownComponent from './RoundCountdown';

const GoogleMapComponent = dynamic(
  () => import('@/components/guess/maps/GoogleMapComponent'),
  { ssr: false },
);

type GuessComponentProps = Pick<
  GameComponentProps,
  'game' | 'handleGuess' | 'handleNextRound'
> & {
  localPlayerID: PlayerId;
  session: Session;
};

const GuessComponent: React.FC<GuessComponentProps> = ({
  localPlayerID,
  session,
  game,
  handleGuess,
  handleNextRound,
}) => {
  const gameRound = useGameRound({ game, localPlayerID, handleGuess });

  const googleMapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
  if (!googleMapApiKey) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAP_API_KEY is not set');
  }

  return (
    <div>
      <div className="fixed w-full h-full z-0">
        <GoogleMapComponent
          API_KEY={googleMapApiKey}
          mapProps={gameRound.mapProps}
        />
      </div>

      {gameRound.showCountdown && (
        <RoundCountdownComponent
          onCountdownEnd={gameRound.handleCountdownEnd}
        />
      )}

      {gameRound.showOverlay && (
        <div className="z-10">
          <OverlayComponent
            localPlayerID={localPlayerID}
            preGuess={gameRound.preGuess}
            session={session}
            game={game}
            handleGuess={handleGuess}
            handleIsTimeUp={gameRound.handleIsTimeUp}
            handleNextRound={handleNextRound}
          />
        </div>
      )}
    </div>
  );
};

export default GuessComponent;
