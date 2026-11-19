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

type GuessProps = Pick<
  GameComponentProps,
  'game' | 'gameReceivedAt' | 'isConnectionReady' | 'handleGuess'
> & {
  localPlayerID: PlayerId;
};

export default function Guess({
  localPlayerID,
  game,
  gameReceivedAt,
  isConnectionReady,
  handleGuess,
}: GuessProps) {
  const gameRound: GameRound = useGameRound({
    game,
    gameReceivedAt,
    localPlayerID,
    isConnectionReady,
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

      {gameRound.countdown > 0 && (
        <RoundCountdown count={gameRound.countdown} />
      )}

      {gameRound.countdown === 0 && (
        <div className="z-10">
          <Overlay
            localPlayerID={localPlayerID}
            endsAt={gameRound.endsAt}
            canGuess={gameRound.canGuess}
            game={game}
            submitPreGuess={gameRound.submitPreGuess}
          />
        </div>
      )}
    </div>
  );
}
