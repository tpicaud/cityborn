import type { PlayerId } from '@cityborn/api';
import {
  type GameComponentProps,
  type GameRound,
  useGameRound,
} from '@cityborn/client/game';
import { View } from 'react-native';
import GameMap from './Map';
import Overlay from './Overlay';
import RoundCountdown from './RoundCountdown';

type GuessProps = Pick<
  GameComponentProps,
  | 'game'
  | 'gameReceivedAt'
  | 'isHost'
  | 'isConnectionReady'
  | 'handleGuess'
  | 'handleNextRound'
> & {
  localPlayerID: PlayerId;
};

const Guess: React.FC<GuessProps> = ({
  localPlayerID,
  game,
  gameReceivedAt,
  isConnectionReady,
  isHost,
  handleGuess,
  handleNextRound,
}) => {
  const gameRound: GameRound = useGameRound({
    game,
    gameReceivedAt,
    localPlayerID,
    isConnectionReady,
    handleGuess,
  });

  return (
    <View className="flex-1">
      <View className="absolute inset-0 z-0">
        <GameMap mapProps={gameRound.mapProps} />
      </View>

      {gameRound.countdown > 0 && (
        <View className="absolute inset-0 z-20">
          <RoundCountdown count={gameRound.countdown} />
        </View>
      )}

      {gameRound.countdown === 0 && (
        <View
          className="absolute inset-0 z-10 bg-transparent"
          pointerEvents="box-none"
        >
          <Overlay
            localPlayerID={localPlayerID}
            endsAt={gameRound.endsAt}
            canGuess={gameRound.canGuess}
            game={game}
            isHost={isHost}
            submitPreGuess={gameRound.submitPreGuess}
            handleNextRound={handleNextRound}
          />
        </View>
      )}
    </View>
  );
};

export default Guess;
