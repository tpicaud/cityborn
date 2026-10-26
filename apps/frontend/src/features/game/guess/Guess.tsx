'use client';

import type { PlayerId } from '@cityborn/api';
import {
  type GameComponentProps,
  type GameRound,
  useGameRound,
} from '@cityborn/client/game';
import dynamic from 'next/dynamic';
import { frontendClientConfig } from '@/config/client';
import Overlay from '@/features/game/guess/Overlay';
import RoundCountdown from './RoundCountdown';

const GameMap = dynamic(() => import('@/features/game/guess/Map'), {
  ssr: false,
});

type GuessProps = Pick<GameComponentProps, 'game' | 'handleGuess'> & {
  localPlayerID: PlayerId;
};

export default function Guess({
  localPlayerID,
  game,
  handleGuess,
}: GuessProps) {
  const gameRound: GameRound = useGameRound({
    game,
    localPlayerID,
    handleGuess,
  });

  return (
    <div>
      <div className="fixed w-full h-full z-0">
        <GameMap
          googleMapsApiKey={frontendClientConfig.googleMapsApiKey}
          mapProps={gameRound.mapProps}
        />
      </div>

      {gameRound.showCountdown && (
        <RoundCountdown
          endAt={gameRound.countdownEndsAt}
          onCountdownEnd={gameRound.handleCountdownEnd}
        />
      )}

      {gameRound.showOverlay && (
        <div className="z-10">
          <Overlay
            localPlayerID={localPlayerID}
            preGuess={gameRound.preGuess}
            game={game}
            handleGuess={handleGuess}
            handleIsTimeUp={gameRound.handleIsTimeUp}
          />
        </div>
      )}
    </div>
  );
}
