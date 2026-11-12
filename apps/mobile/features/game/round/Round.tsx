import {
  type Coord,
  type Game,
  type PlayerId,
  type RoundGuessObject,
  RoundStatus,
} from '@cityborn/api';
import {
  canSubmitGuess,
  createGuessProgress,
  createRoundResult,
  currentGuessObject,
  formatRoundOutcome,
  type GameDisplay,
  type GameRound,
  type GuessProgress,
  type RoundResult,
  useGameRound,
} from '@cityborn/client/game';
import {
  Button,
  MapHudScreen,
  PortraitCard,
  ScoreBanner,
} from '@cityborn/design-system';
import RoundMap from './RoundMap';
import { RoundStartCountdown } from './RoundStartCountdown';
import { RoundTimer } from './RoundTimer';

type RoundProps = {
  localPlayerID: PlayerId;
  isHost: boolean;
  game: Game;
  gameDisplay: GameDisplay;
  handleGuess: (coordinates: Coord | undefined) => Promise<void>;
  handleNextRound: () => Promise<void>;
  onOpenOptions: (() => void) | undefined;
};

type RoundActionProps = Omit<RoundProps, 'onOpenOptions'> & {
  preGuess: Coord | undefined;
};

function RoundAction({
  localPlayerID,
  isHost,
  game,
  gameDisplay,
  preGuess,
  handleGuess,
  handleNextRound,
}: RoundActionProps) {
  if (game.state.currentRound?.status === RoundStatus.GUESSING) {
    const { hasLocalGuess, guessedPlayerCount, playerCount }: GuessProgress =
      createGuessProgress(game, localPlayerID);

    return (
      <Button
        variant="glow"
        label={
          hasLocalGuess ? `${guessedPlayerCount}/${playerCount}` : 'Guess !'
        }
        disabled={!canSubmitGuess(game, localPlayerID, preGuess)}
        onPress={async () => {
          if (preGuess) await handleGuess(preGuess);
        }}
      />
    );
  }

  if (!gameDisplay.showNextRound) return null;

  return (
    <Button
      label="Suivant"
      tabletDetail={`${gameDisplay.roundNumber}/${gameDisplay.roundCount}`}
      disabled={!isHost}
      onPress={handleNextRound}
    />
  );
}

export function Round({ onOpenOptions, ...roundActionProps }: RoundProps) {
  const {
    localPlayerID,
    game,
    handleGuess,
  }: Omit<RoundProps, 'onOpenOptions'> = roundActionProps;
  const gameRound: GameRound = useGameRound({
    game,
    localPlayerID,
    handleGuess,
  });
  const guessObject: RoundGuessObject | undefined = currentGuessObject(game);
  const roundResult: RoundResult | undefined = createRoundResult(
    game,
    localPlayerID,
  );

  return (
    <MapHudScreen
      map={<RoundMap mapProps={gameRound.mapProps} />}
      gauge={
        gameRound.showOverlay ? (
          <RoundTimer
            totalTimeInSeconds={game.config.timer}
            isRunning={game.state.currentRound?.status === RoundStatus.GUESSING}
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
        gameRound.showOverlay ? (
          <RoundAction {...roundActionProps} preGuess={gameRound.preGuess} />
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
