'use client';

import type { Coord, Game, PlayerId, RoundGuessObject } from '@cityborn/api';
import {
  createRoundResult,
  currentGuessObject,
  formatRoundOutcome,
  type GameRound,
  type GameRoundOptions,
  type RoundAction,
  type RoundResult,
  useGameRound,
} from '@cityborn/client/game';
import {
  Button,
  MapHudScreen,
  PortraitCard,
  ScoreBanner,
} from '@cityborn/design-system';
import dynamic from 'next/dynamic';
import { frontendClientConfig } from '@/config/client';
import { RoundStartCountdown } from './RoundStartCountdown';
import { RoundTimer } from './RoundTimer';

const RoundMap = dynamic(() => import('./RoundMap'), { ssr: false });

type RoundProps = {
  localPlayerID: PlayerId;
  isHost: boolean;
  game: Game;
  handleGuess: (coordinates: Coord | undefined) => Promise<void>;
  handleNextRound: () => Promise<void>;
  onOpenOptions: (() => void) | undefined;
};

export function Round({ onOpenOptions, ...gameRoundOptions }: RoundProps) {
  const { game, localPlayerID }: GameRoundOptions = gameRoundOptions;
  const gameRound: GameRound = useGameRound(gameRoundOptions);
  const roundAction: RoundAction | undefined = gameRound.roundAction;
  const guessObject: RoundGuessObject | undefined = currentGuessObject(game);
  const roundResult: RoundResult | undefined = createRoundResult(
    game,
    localPlayerID,
  );

  return (
    <MapHudScreen
      map={
        <RoundMap
          googleMapsApiKey={frontendClientConfig.googleMapsApiKey}
          mapProps={gameRound.mapProps}
        />
      }
      gauge={
        gameRound.showOverlay ? (
          <RoundTimer
            totalTimeInSeconds={game.config.timer}
            isRunning={gameRound.isTimerRunning}
            onTimeUp={gameRound.handleIsTimeUp}
          />
        ) : undefined
      }
      card={
        gameRound.showOverlay && guessObject ? (
          <PortraitCard name={guessObject.name} imageUrl={guessObject.image} />
        ) : undefined
      }
      onOpenOptions={onOpenOptions}
      banner={
        gameRound.showOverlay && roundResult ? (
          <ScoreBanner
            caption={formatRoundOutcome(roundResult.localOutcome)}
            title={roundResult.guessObject.world_location.name}
            score={roundResult.localPoints}
          />
        ) : undefined
      }
      action={
        gameRound.showOverlay && roundAction ? (
          <Button
            variant={roundAction.kind === 'guess' ? 'glow' : 'primary'}
            label={roundAction.label}
            tabletDetail={roundAction.detail}
            disabled={!roundAction.isEnabled}
            onPress={gameRound.handleRoundAction}
          />
        ) : undefined
      }
      overlay={
        gameRound.showCountdown ? (
          <RoundStartCountdown onCountdownEnd={gameRound.handleCountdownEnd} />
        ) : undefined
      }
    />
  );
}
