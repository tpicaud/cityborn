'use client';

import type { PlayerId } from '@cityborn/api';
import {
  type GameComponentProps,
  type GameRoundController,
  useGameRound,
} from '@cityborn/client/game';
import dynamic from 'next/dynamic';
import Overlay from '@/components/guess/Overlay';
import { frontendClientConfig } from '@/config/client';
import RoundCountdown from './RoundCountdown';

const GameMap = dynamic(() => import('@/components/guess/Map'), {
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
  const gameRound: GameRoundController = useGameRound({
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
        <RoundCountdown onCountdownEnd={gameRound.handleCountdownEnd} />
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
